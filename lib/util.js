"use strict";

var _ = require('lodash')
  , fs = require('fs')
  , B = require('bluebird');

// return true if the the value is not undefined, null, or empty string.
exports.hasContent = function (val) {
  return _.isString(val) && val !== "";
};

// return true if the the value is not undefined, null, or NaN.
exports.hasValue = function (val) {
  var hasValue = false;

  // avoid incorrectly evaluating `0` as false
  if (_.isNumber(val)) {
    hasValue = !_.isNaN(val);
  } else {
    hasValue = !_.isUndefined(val) && !_.isNull(val);
  }

  return hasValue;
};

// promise which resolves true if program has access to read the path passed in, false otherwise
exports.fileExists = function (path) {
  return new B(function (resolve) {
    fs.access(path, fs.F_OK | fs.R_OK, function (err) {
      resolve(!err);
    });
  });
};

exports.nodeifyModule = function (obj) {
  if (typeof obj !== "function") {
    var nodeified = {};
    _.each(Object.getOwnPropertyNames(obj), function (name) {
      if (name !== "__esModule") {
        nodeified[name] = exports.nodeifyModule(obj[name]);
      }
    });
    return nodeified;
  }
  return function () {
    var args = Array.prototype.slice.call(arguments, 0);
    var cb = args[args.length - 1];
    args = args.slice(0, -1);
    return B.resolve(obj.apply(null, args)).nodeify(cb);
  };
};
