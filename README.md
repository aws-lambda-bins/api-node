## AWS Lambda bins API

[![Build Status](https://travis-ci.org/aws-lambda-bins/api-node.svg?branch=master)](https://travis-ci.org/aws-lambda-bins/api-node)

A setup tools for aws-lambda-bins.

## Usage

```js
const api = require('aws-lambda-bins');
const exec = require('child_process').exec;

exports.handler = (event, context, callback) => {
  api.install({bin: "git"}, () => {
    exec('git --version', (error, stdout, stderr) => {
      console.log(stdout);
      //=> git version 2.11.0
      callback(null);
    });
  });
};
```
