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

/*
 * Returns object consisting of all properties in the original element
 * which were truthy given the predicate.
 * If the predicate is
 *   * missing - it will remove all properties whose values are `undefined`
 *   * a scalar - it will test all properties' values against that value
 *   * a function - it will pass each value and the original object into the function
 */
function filterObject (obj, predicate) {
  let newObj = _.clone(obj);
  if (_.isUndefined(predicate)) {
    // remove any element from the object whose value is undefined
    predicate = (v) => !_.isUndefined(v);
  } else if (!_.isFunction(predicate)) {
    // make predicate into a function
    const valuePredicate = predicate;
    predicate = (v) => v === valuePredicate;
  }
  for (const key of Object.keys(obj)) {
    if (!predicate(obj[key], obj)) {
      delete newObj[key];
    }
  }
  return newObj;
}

/**
 * Converts number of bytes to a readable size string.
 *
 * @param {number|string} bytes - The actual number of bytes.
 * @returns {string} The actual string representation, for example
 *                   '1.00 KB' for '1024 B'
 * @throws {Error} If bytes count cannot be converted to an integer or
 *                 if it is less than zero.
 */
function toReadableSizeString (bytes) {
  const intBytes = parseInt(bytes, 10);
  if (isNaN(intBytes) || intBytes < 0) {
    throw new Error(`Cannot convert '${bytes}' to a readable size format`);
  }
  if (intBytes >= 1024 * 1024 * 1024) {
    return `${parseFloat(intBytes / (1024 * 1024 * 1024.0)).toFixed(2)} GB`;
  } else if (intBytes >= 1024 * 1024) {
    return `${parseFloat(intBytes / (1024 * 1024.0)).toFixed(2)} MB`;
  } else if (intBytes >= 1024) {
    return `${parseFloat(intBytes / 1024.0).toFixed(2)} KB`;
  }
  return `${intBytes} B`;
}

export { hasValue, escapeSpace, escapeSpecialChars, localIp, cancellableDelay,
         multiResolve, safeJsonParse, unwrapElement, filterObject,
         toReadableSizeString };
