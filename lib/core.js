"use strict";

var child_process = require('child_process')
  , B = require('bluebird');

exports.exec = B.promisify(child_process.exec);
