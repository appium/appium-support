
import _ from 'lodash';
import fs from 'fs';
import os from 'os';
import B from 'bluebird';
import { getLogger } from 'appium-logger';

let logger = getLogger('Appium-Support');

let promisifiedExists = B.promisify(fs.exists);
let promisifiedMkdir = B.promisify(fs.mkdir);
let promisifiedAccess = B.promisify(fs.access);
// return true if the the value is not undefined, null, or empty string.
export function hasContent (val) {
  return _.isString(val) && val !== "";
}

// return true if the the value is not undefined, null, or NaN.
export function hasValue (val) {
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
export function escapeSpace (str) {
  return str.split(/ /).join('\\ ');
}

// promise which resolves true if program has access to read the path passed in,
// false otherwise
export async function fileExists (path) {
  
    // TODO update requirements to node v0.12. Until then, fs.access might
    // not be defined

  if (!fs.access) {
    try { 
      let exists = await promisifiedExists(path);
      return exists;
    } catch (err) {
      logger.errorAndThrow(err);
    }
  }
  try { 
    await promisifiedAccess(path, fs.F_OK | fs.R_OK);
  } catch (err) {
    return false;
  }
  return true;
}

export async function mkdirp (dirName) {
  try { 
    await promisifiedMkdir(dirName);
  } catch (err) {
    if (err && err.code !== "EEXIST") {
      logger.errorAndThrow(err);
    } 
  }
}

export function nodeifyModule (obj) {
  if (typeof obj !== "function") {
    let nodeified = {};
    _.each(Object.getOwnPropertyNames(obj), function (name) {
      if (name !== "__esModule") {
        nodeified[name] = exports.nodeifyModule(obj[name]);
      }
    });
    return nodeified;
  }
  
  return function () {
    let args = Array.prototype.slice.call(arguments, 0);
    let cb = args[args.length - 1];
    args = args.slice(0, -1);
    return B.resolve(obj.apply(null, args)).nodeify(cb);
  };
}

export function localIp () {
  let ip = _.chain(os.networkInterfaces())
    .values()
    .flatten()
    .filter(function (val) {
      return (val.family === 'IPv4' && val.internal === false);
    })
    .pluck('address')
    .first().value();
  return ip;
}
