'use strict';

const Worker = require('./worker');

class Workers {
  constructor(workerNum, type, exitCB, errorCB, disconnectCB, messageCB, onlineCB) {
    this._workers = [];
    this._workerNum = workerNum;
    this._type = type;
    this._exitCB = exitCB;
    this._errorCB = errorCB;
    this._disconnectCB = disconnectCB;
    this._messageCB = messageCB;
    this._onlineCB = onlineCB;
    this.start();
  }

  get count() {
    return this._workers.length;
  }

  get runningTasksCount() {
    return this._workers.reduce((accumulator, currentValue) => accumulator + currentValue.runningTasksCount, 0);
  }

  get runningTasksCountPerWorker() {
    return this._workers.map(worker => worker.runningTasksCount);
  }

  start() {
    for (let index = 0; index < this._workerNum; index++) {
      const worker = Worker.spawn(this._type
        , () => {
          const removeRunningTasks = this._removeWorker(worker.id);
          this._exitCB(removeRunningTasks);
        }, () => {
          const removeRunningTasks = this._removeWorker(worker.id);
          this._errorCB(removeRunningTasks);
        }, () => {
          const removeRunningTasks = this._removeWorker(worker.id);
          this._disconnectCB(removeRunningTasks);
        }, result => {
          worker.receiveResult(result);
          this._messageCB(result);
        }, () => {
          this._addWorker(worker);
          this._onlineCB();
        });
    }
  }

  _addWorker(worker) {
    this._workers.push(worker);
  }

  _removeWorker(workerID) {
    const workerIndex = this._workers.findIndex(worker => worker.id === workerID);
    if (workerIndex !== -1) {
      const removeRunningTasks = this._workers[workerIndex].runningTasks;
      this._workers.splice(workerIndex, 1);
      return removeRunningTasks;
    }
    return [];
  }

  _getFreeWorker() {
    if (this.count) {
      let workerIndex = 0;
      for (let index = 1; index < this.count; index++) {
        if (this._workers[index].runningTasksCount < this._workers[workerIndex].runningTasksCount) {
          workerIndex = index;
        }
      }
      return this._workers[workerIndex];
    }
  }

  terminate() {
    let removeRunningTasks = [];
    for (const worker of this._workers) {
      removeRunningTasks = removeRunningTasks.concat(worker.terminate());
    }
    this._workers = [];
    return removeRunningTasks;
  }

  sendTask(task) {
    const worker = this._getFreeWorker();
    if (worker) {
      task.workerID = worker.id;
      worker.sendTask(task);
      return true;
    }
    return false;
  }
}

module.exports = Workers;
