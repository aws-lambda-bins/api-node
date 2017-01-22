'use strict';

const child_process = require('child_process');
const fs = require('fs');
const https = require('https');
const path = require('path');

const tmpPath = '/tmp'
const usrPath = path.join(tmpPath, 'usr');
const vendorPath = path.join(tmpPath, 'vendor');

const defaultOptions = {
  verify: false,
  url: 'https://s3-ap-northeast-1.amazonaws.com/aws-lambda-bins'
};

class API {
  constructor() {
    this.options = Object.assign({}, defaultOptions);
  }

  set(options) {
    Object.assign(this.options, options);
  }

  resetOptions() {
    this.options = Object.assign({}, defaultOptions);
  }

  install(options, callback) {
    this.appendPATH(path.join(usrPath, 'bin'));
    const url = this.url_for(options)
    this.download(url, callback);
  }


  appendPATH(path) {
    const paths = process.env.PATH.split(':');
    if (paths.indexOf(path) === -1) {
      paths.unshift(path);
      process.env.PATH = paths.join(':');
    }
  }

  download(url, callback) {
    fs.mkdir(vendorPath, () => {
      const filename = path.basename(url);
      const downloadPath = path.join(vendorPath, filename);

      fs.stat(downloadPath, (err, stats) => {
        if (err) {
          const file = fs.createWriteStream(downloadPath);
          const unarchiveCmd = `tar -C ${tmpPath} -xf ${downloadPath}`;
          https.get(url, (res) => res.pipe(file))
            .on('close', () => child_process.exec(unarchiveCmd, callback));
        } else {
          callback();
          // TODO: should verify a file
        }
      });
    });
  }

  url_for(options) {
    const bin = options.bin;
    const tag = options.tag || 'master';
    return `${this.options.url}/${bin}/${bin}-${tag}.tar.gz`;
  }
}

module.exports = API;
