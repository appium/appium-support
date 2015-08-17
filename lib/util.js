import B from 'bluebird';
import _ from 'lodash';
import os from 'os';
import fs from './fs';
import path from 'path';

export function hasContent (val) {
  return _.isString(val) && val !== "";
}

// return true if the the value is not undefined, null, or NaN.
function hasValue (val) {
  let hasVal = false;
  // avoid incorrectly evaluating `0` as false
  if (_.isNumber(val)) {
    hasVal = !_.isNaN(val);
  } else {
    hasVal = !_.isUndefined(val) && !_.isNull(val);
  }

  return hasVal;
}

// escape spaces in string, for commandline calls
function escapeSpace (str) {
  return str.split(/ /).join('\\ ');
}

// promise which resolves true if program has access to read the path passed in,
// false otherwise
async function hasAccess (path) {
  // TODO: deprecate, use fs.hasAccess instead
  return fs.hasAccess(path);
}

async function mkdir (dirName) {
  try {
    await fs.mkdir(dirName);
  } catch (err) {
    if (err && err.code !== "EEXIST") {
      throw err;
    }
  }
}

function localIp () {
  let ip = _.chain(os.networkInterfaces())
    .values()
    .flatten()
    .filter(function (val) {
      return (val.family === 'IPv4' && val.internal === false);
    })
    .pluck('address')
    .first()
    .value();
  return ip;
}

/*
 * Creates a promise that is cancellable, and will timeout
 * after `ms` delay
 */
function cancellableDelay (ms) {
  let timer;
  return new B.Promise((resolve) => {
    timer = setTimeout(function() {
      resolve();
    }, ms);
  })
  .cancellable()
  .catch(B.CancellationError, (err) => {
    clearTimeout(timer);
    throw err;
  });
}

function multiResolve (roots) {
  var args = Array.prototype.slice.call(arguments, 1);
  var paths = [];
  _.each(roots, function (root) {
    var resolveArgs = [root].concat(args);
    paths.push(path.resolve.apply(null, resolveArgs));
  });
  return paths;
}

export { hasValue, escapeSpace, hasAccess, mkdir, localIp, cancellableDelay, multiResolve };
