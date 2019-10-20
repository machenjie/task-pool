'use strict';

class Workers {
  constructor() {
    this._workers = [];
  }

  get count() {
    return this._workers.length;
  }

  get runningTasksCount() {
    return this._workers.reduce((accumulator, currentValue) => accumulator + currentValue.runningTasksCount, 0);
  }

  addWorker(worker) {
    this._workers.push(worker);
  }

  removeWorker(workerID) {
    const workerIndex = this._workers.findIndex(worker => worker.id === workerID);
    if (workerIndex !== -1) {
      const removeRunningTasks = this._workers[workerIndex].runningTasks;
      this._workers.splice(workerIndex, 1);
      return removeRunningTasks;
    }
    return [];
  }

  getWorkerByID(workerID) {
    const workerIndex = this._workers.findIndex(worker => worker.id === workerID);
    if (workerIndex !== -1) {
      return this._workers[workerIndex];
    }
  }

  getFreeWorker() {
    if (this.count) {
      let workerIndex = 0;
      for (let index = 1; index < this.count; index++) {
        if (this._workers[index].count < this._workers[workerIndex].count) {
          workerIndex = index;
        }
      }
      return this._workers[workerIndex];
    }
  }
}

module.exports = Workers;
