'use strict';

const cluster = require('cluster');
const path = require('path');

const WorkerType = {
  WORKER_TYPE_CLUSTER: 'cluster',
  WORKER_TYPE_THREAD: 'thread',
};

class Worker {
  static spawn(type = WorkerType.WORKER_TYPE_CLUSTER) {
    if (type === WorkerType.WORKER_TYPE_CLUSTER) {
      cluster.setupMaster({
        exec: path.resolve(__dirname, 'cluster-worker-task.js'),
        silent: true,
      });
      const worker = cluster.fork();
      return new Worker(worker, type);
    } else if (type === WorkerType.WORKER_TYPE_THREAD) {
      const ThreadWorker = require('worker_threads').Worker;
      const worker = new ThreadWorker(path.resolve(__dirname, 'thread-worker-task.js'));
      return new Worker(worker, type);
    }
  }

  constructor(worker, type) {
    this._worker = worker;
    this._type = type;
    this._count = 0;
    this._runningTasks = [];
  }

  get count() {
    return this._count;
  }

  get id() {
    if (this._type === WorkerType.WORKER_TYPE_CLUSTER) {
      return this._worker.id;
    } else if (this._type === WorkerType.WORKER_TYPE_THREAD) {
      return this._worker.threadId;
    }
  }

  get runningTasks() {
    return [ ...this._runningTasks ];
  }

  get runningTasksCount() {
    return this._runningTasks.length;
  }

  sendTask(task) {
    if (this._type === WorkerType.WORKER_TYPE_CLUSTER) {
      this._worker.send(task);
    } else if (this._type === WorkerType.WORKER_TYPE_THREAD) {
      this._worker.postMessage(task);
    }
    this._runningTasks.push(task);
    this._count++;
  }

  receiveResult(result) {
    this._count--;
    this._runningTasks = this._runningTasks.filter(task => task.msgID !== result.msgID);
  }

  on(...args) {
    this._worker.on(...args);
  }
}

module.exports = Worker;
