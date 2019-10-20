'use strict';

const ClusterPool = require('../src/task-pool');
const path = require('path');

const clusterPool = new ClusterPool(2, 200, 'thread');
(async () => {
  for (let i = 0; i < 10; i++) {
    clusterPool.dispatch(path.resolve(__dirname, 'task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  try {
    await clusterPool.wait(10000);
  } catch (e) {
    console.log(e);
  }

  // for (let i = 0; i < 1000; i++) {
  //   clusterPool.dispatch(path.resolve(__dirname, './task.js'), i);
  // }
  // console.log('start cancel', (new Date()).toISOString());
  // await clusterPool.cancel();
  // console.log('end cancel', (new Date()).toISOString());
})();
