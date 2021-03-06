# task-pool
Easy way to manage a pool of workers, support cluster mode that will run tasks in different process, thread mode that will run tasks in different thread and normal mode that will run tasks in the current thread!

If need to use thread mode, please use the **--experimental-worker** flag to run correctly, since this resource still experimental in NodeJs.

## Introduction
If you want to run tasks in pool, you need this. 

Cluster mode and thread mode can help you run out of your computer resource, normal mode can help you mange your tasks.

You can mixed use these mode to get something powerful.

## Prerequisites
* [NodeJs](https://nodejs.org/en/) (v 10.15.0 or later)
* [Npm](https://www.npmjs.com/)


## Installation

```sh
$ npm install @mcjxy/task-pool [--save]
```

## Examples
[test.js](https://github.com/machenjie/task-pool/blob/master/test/test.js)
```
const TaskPool = require('@mcjxy/task-pool');
const path = require('path');

const taskPool = new TaskPool(9, 200);
(async () => {
  for (let i = 0; i < 200; i++) {
    taskPool.dispatch(path.resolve(__dirname, './task.js'), i).then(v => {
      console.log('main: data ', v);
    }).catch(e => {
      console.log(e);
    });
  }
  await taskPool.wait();

  for (let i = 0; i < 1000; i++) {
    taskPool.dispatch(path.resolve(__dirname, './task.js'), i);
  }
  console.log('start cancel', (new Date()).toISOString());
  await taskPool.cancel();
  console.log('end cancel', (new Date()).toISOString());
})();
```
Note: In thread mode, if the thread count is more than 10, after you use the console.log in every thread, you will get a warning: (node:9768) MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 error listeners added. Use "emitter.setMaxListeners()" to increase limit. You can add "--trace-warnings" start option to check more information. So be careful of using "console.log" when your thread is more than 9.

Note: In thread mode and cluster mode, each thread or cluster has a separate global data, but tasks in the same thread or cluster can share the global data.
## API

### TaskPool(workerNum, maxRunningTask, type)
the constructor, after you call this, task pool are ready
- `workerNum` :  <integer> Worker number of the pool. default is cpu number
- `maxRunningTask` : <integer> Max running tasks of all threads. 0 for unlimited. default is 0
- `type` :  <string> Type of task pool mode, support 'cluster', 'thread' and 'normal''. default is 'cluster'. 'normal' mode use current thread to run task, you can use this mode to mange the tasks

**Note:** A running task means that a normal method is not returned or a promise is not triggered.

### TaskPool.init(timeout)
wait until pool init end. You don't need to call this function unless you want your task to be executed immediately after call dispatch at the first time
- `timeout` :  <integer> The max time to wait in millisecond. default is infinite.
- `return` : <promise> Wait until pool init end, or catch the timeout error

### TaskPool.dispatch(file, ...args)
dispatch a task, the tasks will add to the queue until any worker can run the task
- `file` :  <string|function> Javascript absolute file path that will export a function or a function(only normal mode support function type), the function accept two parameter, method(id, ...args), id for the worker id, args for the args input
- `args` : A list of args which will be trans to the method of the js file
- `return` : <promise<any>> You can use this to get task return data

### TaskPool.status()
get the status of the task pool.
- `return` : < object > Follow is the key of the object
    - `queue` : <integer> tasks number need to be send to worker,
    - `running` :  <integer> tasks number running in all workers,
    - `workers` :  <integer> workers count,
    - `runningPerWorker` :  <array[integer]> tasks number running in each worker,
    - `runEnd` :  <integer> tasks number run end,
    - `runSuccess` :  <integer> tasks number run success,
    - `runFailed` :  <integer> tasks number run failed,
 
### TaskPool.wait(timeout)
wait until all the tasks run end
- `timeout` :  <integer> The max time to wait in millisecond. default is infinite.
- `return` : <promise> Wait tasks run end, or catch the timeout error

### TaskPool.waitCanRun(timeout)
wait until running tasks count less than maxRunningTask and queue task count less than maxRunningTask. This is used for avoid out of memory, and get the max effectiveness
- `timeout` :  <integer> The max time to wait in millisecond. default is infinite.
- `return` : <promise> Wait task can run immediately, or catch the timeout error

**Note:** If there are a list of waiters , just one waiter can wakeup at one time.

### TaskPool.cancel(timeout)
cancel the tasks which are not running, and wait until all the running tasks run end
- `timeout` :  <integer> The max time to wait in millisecond. default is infinite.
- `return` : <promise> Wait cancel run end, or catch the timeout error

### TaskPool.terminate(timeout)
terminate all the workers, thread or cluster will be killed
- `timeout` :  <integer> The max time to wait in millisecond. default is infinite.
- `return` : <promise> Wait terminate run end, or catch the timeout error

### TaskPool.start()
start the task pool workers. You can call TaskPool.init(timeout) function to wait the start end. Unless you call the terminate function, otherwise it will take no effect when you call this function


## License

The project is licensed under the MIT License. See the [LICENSE](https://github.com/machenjie/task-pool/blob/master/LICENSE) file for more details
