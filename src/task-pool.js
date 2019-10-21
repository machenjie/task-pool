'use strict';


const { EventEmitter } = require('events');
const uuidv4 = require('uuid/v4');
const WaitNotify = require('wait-notify');
const cpuNum = require('os').cpus().length;
const Msg = require('./define/msg');
const Task = require('./define/task');
const Result = require('./define/result');
const Worker = require('./worker');
const Workers = require('./workers');

class TaskPool {
  constructor(threadNum = cpuNum, maxRunningTask = 0, type = 'cluster') {
    this.type = type;
    this.threadNum = threadNum ? threadNum : cpuNum;
    this.maxRunningTask = maxRunningTask;
    this.queue = [];
    this.canceling = false;
    this.waitingWN = new WaitNotify();
    this.waitingCanRunWN = new WaitNotify();
    this.resultEE = new EventEmitter();
    this.isInit = false;
    this.isIniting = false;
    this.workers = new Workers();
    this.initWN = new WaitNotify();
    this.start();
  }

  async init(timeout = 0) {
    if (!this.isInit && this.isIniting) {
      await this.initWN.wait(timeout);
    }
  }

  async dispatch(file, ...args) {
    if (this.canceling) {
      throw new Error('tasks in canceling');
    }
    const msgID = uuidv4();
    this.queue.push(new Task(file, args, msgID));
    const resultPromise = new Promise((resolve, reject) => {
      this.resultEE.once(msgID, result => {
        result.msgType === Msg.MSG_RUN_ERROR ? reject(result.error) : resolve(result.result);
      });
    });
    this._next();
    return resultPromise;
  }

  async cancel(timeout = 0) {
    this.queue = [];
    this.canceling = true;
    try {
      await this.wait(timeout);
    } finally {
      this.canceling = false;
    }
  }

  async wait(timeout = 0) {
    if (this.workers.runningTasksCount === 0 && this.queue.length === 0) {
      return;
    }
    await this.waitingWN.wait(timeout);
  }

  async waitCanRun(timeout = 0) {
    if (this.workers.runningTasksCount < this.maxRunningTask && this.queue.length === 0) {
      return;
    }
    await this.waitingCanRunWN.wait(timeout);
  }

  async terminate(timeout = 0) {
    await this.init(timeout);
    if (this.isInit) {
      this.queue = [];
      this.canceling = true;
      this.isInit = false;
      this.isIniting = false;
      this.workers.terminate();
      this.workers = new Workers();
      this.waitingWN.notify();
      this.waitingCanRunWN.notify();
      this.canceling = false;
    }
  }

  start() {
    if (!this.isInit && !this.isIniting) {
      this.isIniting = true;
      for (let index = 0; index < this.threadNum; index++) {
        const worker = Worker.spawn(this.type);
        const workerID = worker.id;
        worker.on('exit', () => {
          this._removeWorker(workerID);
        });
        worker.on('error', () => {
          this._removeWorker(workerID);
        });
        worker.on('disconnect', () => {
          this._removeWorker(workerID);
        });
        worker.on('message', result => {
          this._receiveResult(result);
        });
        worker.on('online', () => {
          if (!this.isInit && this.isIniting && this.workers.count + 1 >= this.threadNum) {
            this.initWN.notify();
            this.isInit = true;
            this.isIniting = false;
          }
          this._addWorker(worker);
        });
      }
    }
  }

  _next() {
    if (!this.isInit) {
      return;
    }
    if (this.queue.length === 0) {
      return;
    }
    if (this.maxRunningTask && this.workers.runningTasksCount >= this.maxRunningTask) {
      return;
    }
    this._sendTask();
  }

  _addWorker(worker) {
    this.workers.addWorker(worker);
    this._next();
  }

  _removeWorker(workerID) {
    const removeRunningTasks = this.workers.removeWorker(workerID);
    if (removeRunningTasks) {
      removeRunningTasks.forEach(task => {
        this.resultEE.emit(task.msgID, new Result(Msg.MSG_RUN_ERROR, undefined, 'worker ' + workerID + ' being removed', task.msgID, task.workerID));
      });
    }
    if (this.workers.runningTasksCount === 0 && this.queue.length === 0) {
      this.waitingWN.notify();
    }
    if (this.workers.runningTasksCount < this.maxRunningTask && this.queue.length === 0) {
      this.waitingCanRunWN.notify();
    }
    this._next();
  }

  _sendTask() {
    const worker = this.workers.getFreeWorker();
    if (worker) {
      const task = this.queue.shift();
      task.workerID = worker.id;
      worker.sendTask(task);
      this._next();
    }
  }

  _receiveResult(result) {
    this.resultEE.emit(result.msgID, result);
    const worker = this.workers.getWorkerByID(result.workerID);
    if (worker) {
      worker.receiveResult(result);
      if (this.workers.runningTasksCount === 0 && this.queue.length === 0) {
        this.waitingWN.notify();
      }
      if (this.workers.runningTasksCount < this.maxRunningTask && this.queue.length === 0) {
        this.waitingCanRunWN.notify();
      }
      this._next();
    }
  }
}

module.exports = TaskPool;
