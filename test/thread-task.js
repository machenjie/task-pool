'use strict';

let count = 0;

module.exports = async (id, data) => {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log('worker', id, ': data', data, 'count:', count++);
      resolve(data);
    }, 1000);
  });
};
