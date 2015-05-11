"use strict";

var exec = require('child_process').exec
  , osType = require('os').type();

exports.isWindows = function () {
  return osType === 'Windows_NT';
};

exports.isMac = function () {
  return osType === 'Darwin';
};

exports.isLinux = function () {
  return !exports.isWindows() && !exports.isMac();
};

exports.arch = function (cb) {
  exec("uname -m", function (err, stdout) {
    if (err) return cb(err);
    if (stdout.trim() === "i686") {
      cb(null, "32");
    } else {
      cb(null, "64");
    }
  });
};
