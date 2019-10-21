'use strict';

const isPromise = require('is-promise');
const Msg = require('./define/msg');
const Result = require('./define/result');

let id = 1;

module.exports = ee => {
  ee.id = id++;
  ee.on('task', task => {
    const postResultMessage = result => {
      ee.emit('message', new Result(Msg.MSG_RUN_RESULT, result, undefined, task.msgID, ee.id));
    };
    const postErrorMessage = error => {
      ee.emit('message', new Result(Msg.MSG_RUN_ERROR, undefined, error.toString() + error.stack, task.msgID, ee.id));
    };

    try {
      const method = require(task.file);
      const result = method(ee.id, ...task.args);

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
};
