'use strict';

const isPromise = require('is-promise');
const cluster = require('cluster');
const Msg = require('./define/msg');
const Result = require('./define/result');

process.on('message', task => {
  const postResultMessage = result => {
    process.send(new Result(Msg.MSG_RUN_RESULT, result, undefined, task.msgID, cluster.worker.id));
  };
  const postErrorMessage = error => {
    process.send(new Result(Msg.MSG_RUN_ERROR, undefined, error.toString() + '\n' + error.stack, task.msgID, cluster.worker.id));
  };

  try {
    let method;
    if (typeof task.file === 'string') {
      method = require(task.file);
    } else {
      postErrorMessage(new Error('unknown task function type!'));
      return;
    }
    const result = method(cluster.worker.id, ...task.args);

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
