
import _ from 'lodash';
import _fs from 'fs';
import os from 'os';
import B from 'bluebird';
import { getLogger } from 'appium-logger';

let logger = getLogger('Appium-Support');

let fs = {
  mkdir: B.promisify(_fs.mkdir),
  access: B.promisify(_fs.access)
};


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
  try { 
    await fs.access(path, fs.F_OK | fs.R_OK);
  } catch (err) {
    return false;
  }
  return true;
}

async function mkdir (dirName) {
  try { 
    await fs.mkdir(dirName);
  } catch (err) {
    if (err && err.code !== "EEXIST") {
      logger.errorAndThrow(err);
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

export { hasValue, escapeSpace, hasAccess, mkdir, localIp };