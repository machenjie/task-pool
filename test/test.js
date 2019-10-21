'use strict';

const TaskPool = require('../src/task-pool');
const path = require('path');

async function testThreadPool() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 100; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
}

async function testClusterPool() {
  const taskPool = new TaskPool(2, 5, 'cluster');
  for (let i = 0; i < 10; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'cluster-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
}

async function testThreadPoolTerminate() {
  const taskPool = new TaskPool(2, 5, 'thread');
  for (let i = 0; i < 50; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
}

async function testClusterPoolTerminate() {
  const taskPool = new TaskPool(2, 10, 'cluster');
  for (let i = 0; i < 20; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'cluster-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
}

async function testThreadPoolTerminateStart() {
  const taskPool = new TaskPool(2, 5, 'thread');
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
  taskPool.start();
  for (let i = 0; i < 30; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
}

async function testClusterPoolTerminateStart() {
  const taskPool = new TaskPool(2, 5, 'cluster');
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
  taskPool.start();
  for (let i = 0; i < 10; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'cluster-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
}

async function testTaskPoolInitWait() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 50; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  taskPool.init(10).catch(e => {
    console.log('init wait error:', e);
  });
  await taskPool.init();
  console.log('init success!');
}

async function testTaskPoolTasksWait() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 40; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  taskPool.wait(10).catch(e => {
    console.log('tasks wait error:', e);
  });
  await taskPool.wait();
  console.log('tasks all run end!');
}

async function testTaskPoolTasksWaitCanRun() {
  const taskPool = new TaskPool(2, 4, 'thread');
  for (let i = 0; i < 10; i++) {
    await taskPool.waitCanRun();
    console.log((new Date()).toISOString(), 'send next task!');
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
}

async function testTaskPoolTasksCancel() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 25; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log('error:', e);
    });
  }
  await taskPool.init();
  taskPool.cancel(10).catch(e => {
    console.log('tasks cancel error:', e);
  });
  await taskPool.cancel();
  console.log('tasks all cancel!');
}

testTaskPoolTasksWaitCanRun();
