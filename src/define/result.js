'use strict';

module.exports = class {
  constructor(msgType, result, error, msgID, workerID = -1) {
    this.msgType = msgType;
    this.result = result;
    this.error = error;
    this.msgID = msgID;
    this.workerID = workerID;
  }
};
