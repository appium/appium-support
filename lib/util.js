"use strict";

var _ = require('lodash');

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
