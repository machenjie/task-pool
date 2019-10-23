'use strict';

const fs = require('fs');
const path = require('path');
let count = 0;

module.exports = async (id, data) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      try {
        fs.writeFileSync(path.resolve(__dirname, data + '.txt'), 'worker ' + id + ' : data ' + data + ' count: ' + count++);
      } catch (e) {
        reject(e);
      }
      if (parseInt('0' + data) % 2 === 1) {
        reject(new Error(data));
      } else {
        resolve(data);
      }
    }, 1000);
  });
};
