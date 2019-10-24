'use strict';


const { EventEmitter } = require('events');
const uuidv4 = require('uuid/v4');
const WaitNotify = require('wait-notify');
const cpuNum = require('os').cpus().length;
const Msg = require('./define/msg');
const Task = require('./define/task');
const Result = require('./define/result');
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
    this.initWN = new WaitNotify();
    this.runStatus = {
      runEnd: 0,
      runSuccess: 0,
      runFailed: 0,
    };
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
        this.runStatus.runEnd++;
        result.msgType === Msg.MSG_RUN_ERROR ? this.runStatus.runFailed++ : this.runStatus.runSuccess++;
        result.msgType === Msg.MSG_RUN_ERROR ? reject(result.error) : resolve(result.result);
      });
    });
    this._next();
    return resultPromise;
  }

  async cancel(timeout = 0) {
    this.canceling = true;
    try {
      const removeRunningTasks = this.queue;
      this.queue = [];
      this._removeWorker(removeRunningTasks);
      await this.wait(timeout);
    } finally {
      this.canceling = false;
    }
  }

  async wait(timeout = 0) {
    if (!this.workers || this.workers.runningTasksCount === 0 && this.queue.length === 0) {
      return;
    }
    await this.waitingWN.wait(timeout);
  }

  async waitCanRun(timeout = 0) {
    if (this.workers && this.workers.count && (!this.maxRunningTask || this.workers.runningTasksCount <= this.maxRunningTask && this.queue.length < this.maxRunningTask)) {
      return;
    }
    await this.waitingCanRunWN.wait(timeout);
  }

  async terminate(timeout = 0) {
    await this.init(timeout);
    if (this.isInit) {
      this.isInit = false;
      this.isIniting = false;
      this.canceling = true;
      let removeRunningTasks = this.workers.terminate();
      removeRunningTasks = removeRunningTasks.concat(this.queue);
      this.queue = [];
      this._removeWorker(removeRunningTasks);
      this.canceling = false;
    }
  }

  start() {
    if (!this.isInit && !this.isIniting) {
      this.isIniting = true;
      if (this.workers) {
        this.workers.start();
      } else {
        this.workers = new Workers(this.threadNum, this.type, removeRunningTasks => {
          this._removeWorker(removeRunningTasks);
        }, removeRunningTasks => {
          this._removeWorker(removeRunningTasks);
        }, removeRunningTasks => {
          this._removeWorker(removeRunningTasks);
        }, result => {
          this._receiveResult(result);
        }, () => {
          this._addWorker();
        });
      }
    }
  }

  status() {
    return {
      queue: this.queue.length,
      running: this.workers ? this.workers.runningTasksCount : 0,
      workers: this.workers ? this.workers.count : 0,
      runningPerWorker: this.workers ? this.workers.runningTasksCountPerWorker : 0,
      runEnd: this.runStatus.runEnd,
      runSuccess: this.runStatus.runSuccess,
      runFailed: this.runStatus.runFailed,
    };
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

    const task = this.queue.shift();
    if (this.workers.sendTask(task)) {
      this._next();
    } else {
      this.queue.splice(0, 0, task);
    }
  }

  _addWorker() {
    if (!this.isInit && this.isIniting && this.workers.count >= this.threadNum) {
      this.isInit = true;
      this.isIniting = false;
      this.initWN.notify();
      this._isNeedWaitingNotify();
    }
    this._next();
  }

  _removeWorker(removeRunningTasks) {
    if (removeRunningTasks) {
      removeRunningTasks.forEach(task => {
        if (task.workerID !== -1) {
          this.resultEE.emit(task.msgID, new Result(Msg.MSG_RUN_ERROR, undefined, 'task in worker ' + task.workerID + ' is removed', task.msgID, task.workerID));
        } else {
          this.resultEE.emit(task.msgID, new Result(Msg.MSG_RUN_ERROR, undefined, 'task in queue is removed', task.msgID));
        }
      });
    }
    this._isNeedWaitingNotify();
    this._next();
  }

  _receiveResult(result) {
    this.resultEE.emit(result.msgID, result);
    this._isNeedWaitingNotify();
    this._next();
  }

  _isNeedWaitingNotify() {
    if (!this.workers || this.workers.runningTasksCount === 0 && this.queue.length === 0) {
      this.waitingWN.notify();
    }
    if (this.workers && this.workers.count && (!this.maxRunningTask || this.workers.runningTasksCount <= this.maxRunningTask && this.queue.length < this.maxRunningTask)) {
      this.waitingCanRunWN.notifyOne();
    }
  }
}

module.exports = TaskPool;
