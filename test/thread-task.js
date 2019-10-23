'use strict';

let count = 0;

module.exports = async (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      console.log('worker', id, ': data', data, 'count:', count++);
      if (parseInt('0' + data) % 2 === 1) {
        reject(new Error(data));
      } else {
        resolve(data);
      }
    }, 1000);
  });
};
