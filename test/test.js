'use strict';

const TaskPool = require('../src/task-pool');
const path = require('path');

async function testThreadPool() {
  const taskPool = new TaskPool(2, 5, 'thread');
  for (let i = 0; i < 35; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testClusterPool() {
  const taskPool = new TaskPool(2, 5, 'cluster');
  for (let i = 0; i < 15; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'cluster-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testNormalPool() {
  const taskPool = new TaskPool(2, 5, 'normal');
  for (let i = 0; i < 10; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testNormalPoolWithFunctionTask() {
  const taskPool = new TaskPool(2, 5, 'normal');
  for (let i = 0; i < 20; i++) {
    taskPool.dispatch(async (id, v) => {
      return new Promise(resolve => {
        setTimeout(() => {
          console.log('worker', id, ': data', v);
          resolve(v);
        }, 1000);
      });
    }, i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testThreadPoolTerminate() {
  const taskPool = new TaskPool(2, 5, 'thread');
  for (let i = 0; i < 25; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testClusterPoolTerminate() {
  const taskPool = new TaskPool(2, 10, 'cluster');
  for (let i = 0; i < 20; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'cluster-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testNormalPoolTerminate() {
  const taskPool = new TaskPool(2, 5, 'normal');
  for (let i = 0; i < 20; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  taskPool.terminate(10).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!');
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
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
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
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
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testNormalPoolTerminateStart() {
  const taskPool = new TaskPool(2, 5, 'normal');
  taskPool.terminate(20).catch(e => {
    console.log('terminate error:', e);
  });
  await taskPool.terminate();
  console.log('terminate success!!');
  taskPool.start();
  for (let i = 0; i < 30; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testTaskPoolInitWait() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 35; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  taskPool.init(10).catch(e => {
    console.log('init wait error:', e);
  });
  await taskPool.init();
  console.log('init success!');
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testTaskPoolTasksWait() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 20; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  taskPool.wait(10).catch(e => {
    console.log('tasks wait error:', e);
  });
  await taskPool.wait();
  console.log('tasks all run end!');
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testTaskPoolTasksWaitCanRun() {
  const taskPool = new TaskPool(2, 4, 'thread');
  for (let i = 0; i < 10; i++) {
    await taskPool.waitCanRun();
    console.log((new Date()).toISOString(), 'send next task!');
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testTaskPoolTasksCancel() {
  const taskPool = new TaskPool(2, 10, 'thread');
  for (let i = 0; i < 25; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  await taskPool.init();
  taskPool.cancel(10).catch(e => {
    console.log('tasks cancel error:', e);
  });
  await taskPool.cancel();
  console.log('tasks all cancel!');
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

async function testTaskPoolStatus() {
  const taskPool = new TaskPool(2, 5, 'thread');
  for (let i = 0; i < 30; i++) {
    taskPool.dispatch(path.resolve(__dirname, 'thread-task.js'), i).then(v => {
      console.log('main: success data ', v);
    }).catch(e => {
      console.log('main: error data ', e);
    });
  }
  setInterval(() => {
    console.log(taskPool.status());
  }, 1000);
}

testTaskPoolTasksWaitCanRun();
