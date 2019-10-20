'use strict';

const TaskPool = require('../src/task-pool');
const path = require('path');

const taskPool = new TaskPool(2, 200, 'thread');
(async () => {
  for (let i = 0; i < 10; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  try {
    await taskPool.wait(10000);
  } catch (e) {
    console.log(e);
  }

  for (let i = 0; i < 1000; i++) {
    taskPool.dispatch(path.resolve(__dirname, './task.js'), i);
  }
  console.log('start cancel', (new Date()).toISOString());
  await taskPool.cancel();
  console.log('end cancel', (new Date()).toISOString());
})();
