import B from 'bluebird';
import _ from 'lodash';
import os from 'os';
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

function escapeSpecialChars (str, quoteEscape) {
  if (typeof str !== "string") {
    return str;
  }
  if (typeof quoteEscape === "undefined") {
    quoteEscape = false;
  }
  str = str
        .replace(/[\\]/g, '\\\\')
        .replace(/[\/]/g, '\\/')
        .replace(/[\b]/g, '\\b')
        .replace(/[\f]/g, '\\f')
        .replace(/[\n]/g, '\\n')
        .replace(/[\r]/g, '\\r')
        .replace(/[\t]/g, '\\t')
        .replace(/[\"]/g, '\\"')
        .replace(/\\'/g, "\\'");
  if (quoteEscape) {
    let re = new RegExp(quoteEscape, "g");
    str = str.replace(re, `\\${quoteEscape}`);
  }
  return str;
}

function localIp () {
  let ip = _.chain(os.networkInterfaces())
    .values()
    .flatten()
    .filter(function (val) {
      return (val.family === 'IPv4' && val.internal === false);
    })
    .map('address')
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
    timer = setTimeout(function () {
      resolve();
    }, ms);
  })
  .cancellable()
  .catch(B.CancellationError, (err) => { // eslint-disable-line promise/prefer-await-to-callbacks
    clearTimeout(timer);
    throw err;
  });
}

function multiResolve (roots, ...args) {
  return roots.map((root) => {
    return path.resolve(root, ...args);
  });
}

/*
 * Parses an object if possible. Otherwise returns the object without parsing.
 */
function safeJsonParse (obj) {
  try {
    obj = JSON.parse(obj);
  } catch (ign) {
    // ignore: this is not json parsable
  }
  return obj;
}

/*
 * Removes the wrapper from element, if it exists.
 *   { ELEMENT: 4 } becomes 4
 */
function unwrapElement (el) {
  if (typeof el === 'object' && el.ELEMENT) {
    return el.ELEMENT;
  }
  return el;
}

export { hasValue, escapeSpace, escapeSpecialChars, localIp, cancellableDelay,
         multiResolve, safeJsonParse, unwrapElement };
