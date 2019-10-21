'use strict';

const isPromise = require('is-promise');
const Msg = require('./define/msg');
const Result = require('./define/result');
const { EventEmitter } = require('events');

let id = 1;
const INNER_TASK_MSG = 'INNER_TASK_MSG';

class NormalWorker extends EventEmitter {
  constructor() {
    super();
    this._id = id++;
    this.on(INNER_TASK_MSG, task => {
      const postResultMessage = result => {
        this.emit('message', new Result(Msg.MSG_RUN_RESULT, result, undefined, task.msgID, this.id));
      };
      const postErrorMessage = error => {
        this.emit('message', new Result(Msg.MSG_RUN_ERROR, undefined, error.toString() + '\n' + error.stack, task.msgID, this.id));
      };

      try {
        let method;
        if (typeof task.file === 'string') {
          method = require(task.file);
        } else if (typeof task.file === 'function') {
          method = task.file;
        } else {
          postErrorMessage(new Error('unknown task function type!'));
          return;
        }
        const result = method(this.id, ...task.args);

        if (isPromise(result)) {
          result.then(result => {
            postResultMessage(result);
          }).catch(e => {
            postErrorMessage(e);
          });
        } else {
          postResultMessage(result);
        }
      } catch (e) {
        postErrorMessage(e);
      }
    });
    process.nextTick(() => {
      this.emit('online');
    });
  }

  get id() {
    return this._id;
  }

  postMessage(value) {
    this.emit(INNER_TASK_MSG, value);
  }

  terminate() {
    this.emit('exit', 1);
  }
}

module.exports = NormalWorker;
