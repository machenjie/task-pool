'use strict';

const isPromise = require('is-promise');
const { parentPort, threadId } = require('worker_threads');
const Msg = require('./define/msg');
const Result = require('./define/result');

parentPort.on('message', task => {
  const postResultMessage = result => {
    parentPort.postMessage(new Result(Msg.MSG_RUN_RESULT, result, undefined, task.msgID, threadId));
  };
  const postErrorMessage = error => {
    parentPort.postMessage(new Result(Msg.MSG_RUN_ERROR, undefined, error.toString() + '\n' + error.stack, task.msgID, threadId));
  };

  try {
    let method;
    if (typeof task.file === 'string') {
      method = require(task.file);
    } else {
      postErrorMessage(new Error('unknown task function type!'));
      return;
    }
    const result = method(threadId, ...task.args);

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
