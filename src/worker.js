'use strict';

const path = require('path');

const WorkerType = {
  WORKER_TYPE_CLUSTER: 'cluster',
  WORKER_TYPE_THREAD: 'thread',
  WORKER_TYPE_NORMAL: 'normal',
};

class Worker {
  static spawn(type = WorkerType.WORKER_TYPE_CLUSTER, exitCB, errorCB, disconnectCB, messageCB, onlineCB) {
    let worker;

    if (type === WorkerType.WORKER_TYPE_CLUSTER) {
      const cluster = require('cluster');

      cluster.setupMaster({
        exec: path.resolve(__dirname, 'cluster-worker-task.js'),
        silent: true,
      });
      worker = new Worker(cluster.fork(), type, exitCB, errorCB, disconnectCB, messageCB, onlineCB);
    } else if (type === WorkerType.WORKER_TYPE_THREAD) {
      const ThreadWorker = require('worker_threads').Worker;

      worker = new Worker(new ThreadWorker(path.resolve(__dirname, 'thread-worker-task.js')), type, exitCB, errorCB, disconnectCB, messageCB, onlineCB);
    } else if (type === WorkerType.WORKER_TYPE_NORMAL) {
      const { EventEmitter } = require('events');
      const normalWorkerTask = require('./normal-worker-task');

      const normalWorker = new EventEmitter();
      normalWorkerTask(normalWorker);
      normalWorker.postMessage = value => {
        normalWorker.emit('task', value);
      };
      normalWorker.terminate = () => {
        normalWorker.emit('exit', 1);
      };
      worker = new Worker(normalWorker, type, exitCB, errorCB, disconnectCB, messageCB, onlineCB);
      process.nextTick(() => {
        normalWorker.emit('online');
      });
    }
    return worker;
  }

  constructor(worker, type, exitCB, errorCB, disconnectCB, messageCB, onlineCB) {
    this._worker = worker;
    this._type = type;
    this._runningTasks = [];
    this._exitCB = exitCB;
    this._errorCB = errorCB;
    this._disconnectCB = disconnectCB;
    this._messageCB = messageCB;
    this._onlineCB = onlineCB;
    if (this._worker) {
      if (this._exitCB) this._worker.on('exit', this._exitCB);
      if (this._errorCB) this._worker.on('error', this._errorCB);
      if (this._disconnectCB) this._worker.on('disconnect', this._disconnectCB);
      if (this._messageCB) this._worker.on('message', this._messageCB);
      if (this._onlineCB) this._worker.on('online', this._onlineCB);
    }
  }

  get id() {
    if (this._type === WorkerType.WORKER_TYPE_CLUSTER) {
      return this._worker.id;
    } else if (this._type === WorkerType.WORKER_TYPE_THREAD) {
      return this._worker.threadId;
    } else if (this._type === WorkerType.WORKER_TYPE_NORMAL) {
      return this._worker.id;
    }
  }

  get runningTasks() {
    return [ ...this._runningTasks ];
  }

  get runningTasksCount() {
    return this._runningTasks.length;
  }

  sendTask(task) {
    if (this._worker) {
      if (this._type === WorkerType.WORKER_TYPE_CLUSTER) {
        this._worker.send(task);
      } else if (this._type === WorkerType.WORKER_TYPE_THREAD) {
        this._worker.postMessage(task);
      } else if (this._type === WorkerType.WORKER_TYPE_NORMAL) {
        this._worker.postMessage(task);
      }
      this._runningTasks.push(task);
    }
  }

  receiveResult(result) {
    this._runningTasks = this._runningTasks.filter(task => task.msgID !== result.msgID);
  }

  terminate() {
    if (this._worker) {
      if (this._exitCB) this._worker.removeListener('exit', this._exitCB);
      if (this._errorCB) this._worker.removeListener('error', this._errorCB);
      if (this._disconnectCB) this._worker.removeListener('disconnect', this._disconnectCB);
      if (this._messageCB) this._worker.removeListener('message', this._messageCB);
      if (this._onlineCB) this._worker.removeListener('online', this._onlineCB);
      if (this._type === WorkerType.WORKER_TYPE_CLUSTER) {
        this._worker.kill();
      } else if (this._type === WorkerType.WORKER_TYPE_THREAD) {
        this._worker.terminate();
      } else if (this._type === WorkerType.WORKER_TYPE_NORMAL) {
        this._worker.terminate();
      }
      const runningTasks = this._runningTasks;
      this._runningTasks = [];
      return runningTasks;
    }
    return [];
  }
}

module.exports = Worker;
