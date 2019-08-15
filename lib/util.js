import B from 'bluebird';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import fs from './fs';
import semver from 'semver';
import { quote as shellQuote } from 'shell-quote';

const W3C_WEB_ELEMENT_IDENTIFIER = 'element-6066-11e4-a52e-4f735466cecf';

export function hasContent (val) {
  return _.isString(val) && val !== '';
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
  if (typeof str !== 'string') {
    return str;
  }
  if (typeof quoteEscape === 'undefined') {
    quoteEscape = false;
  }
  str = str
    .replace(/[\\]/g, '\\\\')
    .replace(/[\/]/g, '\\/') // eslint-disable-line no-useless-escape
    .replace(/[\b]/g, '\\b')
    .replace(/[\f]/g, '\\f')
    .replace(/[\n]/g, '\\n')
    .replace(/[\r]/g, '\\r')
    .replace(/[\t]/g, '\\t')
    .replace(/[\"]/g, '\\"') // eslint-disable-line no-useless-escape
    .replace(/\\'/g, "\\'");
  if (quoteEscape) {
    let re = new RegExp(quoteEscape, 'g');
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
  let resolve;
  let reject;

  const delay = new B.Promise((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
    timer = setTimeout(function () {
      resolve();
    }, ms);
  });

  // override Bluebird's `cancel`, which does not work when using `await` on
  // a promise, since `resolve`/`reject` are never called
  delay.cancel = function () {
    clearTimeout(timer);
    reject(new B.CancellationError());
  };
  return delay;
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
    return JSON.parse(obj);
  } catch (ign) {
    // ignore: this is not json parsable
    return obj;
  }
}

/*
 * Removes the wrapper from element, if it exists.
 *   { ELEMENT: 4 } becomes 4
 *   { element-6066-11e4-a52e-4f735466cecf: 5 } becomes 5
 */
function unwrapElement (el) {
  for (const propName of [W3C_WEB_ELEMENT_IDENTIFIER, 'ELEMENT']) {
    if (_.has(el, propName)) {
      return el[propName];
    }
  }
  return el;
}

function wrapElement (elementId) {
  return {
    ELEMENT: elementId,
    [W3C_WEB_ELEMENT_IDENTIFIER]: elementId,
  };
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

/**
 * Checks whether the given path is a subpath of the
 * particular root folder. Both paths can include .. and . specifiers
 *
 * @param {string} originalPath The absolute file/folder path
 * @param {string} root The absolute root folder path
 * @param {?boolean} forcePosix Set it to true if paths must be interpreted in POSIX format
 * @returns {boolean} true if the given original path is the subpath of the root folder
 * @throws {Error} if any of the given paths is not absolute
 */
function isSubPath (originalPath, root, forcePosix = null) {
  const pathObj = forcePosix ? path.posix : path;
  for (const p of [originalPath, root]) {
    if (!pathObj.isAbsolute(p)) {
      throw new Error(`'${p}' is expected to be an absolute path`);
    }
  }
  const normalizedRoot = pathObj.normalize(root);
  const normalizedPath = pathObj.normalize(originalPath);
  return normalizedPath.startsWith(normalizedRoot);
}

/**
 * Checks whether the given paths are pointing to the same file system
 * destination.
 *
 * @param {string} path1 - Absolute or relative path to a file/folder
 * @param {string} path2 - Absolute or relative path to a file/folder
 * @param {...string} pathN - Zero or more absolute or relative paths to files/folders
 * @returns {boolean} true if all paths are pointing to the same file system item
 */
async function isSameDestination (path1, path2, ...pathN) {
  const allPaths = [path1, path2, ...pathN];
  if (!await B.reduce(allPaths, async (a, b) => a && await fs.exists(b), true)) {
    return false;
  }

  const areAllItemsEqual = (arr) => !!arr.reduce((a, b) => a === b ? a : NaN);
  if (areAllItemsEqual(allPaths)) {
    return true;
  }
  return areAllItemsEqual(await B.map(allPaths, async (x) => (await fs.stat(x)).ino));
}

/**
 * Coerces the given number/string to a valid version string
 *
 * @param {string|number} ver - Version string to coerce
 * @param {boolean} strict [true] - If true then an exception will be thrown
 * if `ver` cannot be coerced
 * @returns {string} Coerced version number or null if the string cannot be
 * coerced and strict mode is disabled
 * @throws {Error} if strict mode is enabled and `ver` cannot be coerced
 */
function coerceVersion (ver, strict = true) {
  const result = semver.valid(semver.coerce(`${ver}`));
  if (strict && !result) {
    throw new Error(`'${ver}' cannot be coerced to a valid version number`);
  }
  return result;
}

const SUPPORTED_OPERATORS = ['==', '!=', '>', '<', '>=', '<=', '='];

/**
 * Compares two version strings
 *
 * @param {string|number} ver1 - The first version number to compare. Should be a valid
 * version number supported by semver parser.
 * @param {string|number} ver2 - The second version number to compare. Should be a valid
 * version number supported by semver parser.
 * @param {string} operator - One of supported version number operators:
 * ==, !=, >, <, <=, >=, =
 * @returns {boolean} true or false depending on the actual comparison result
 * @throws {Error} if an unsupported operator is supplied or any of the supplied
 * version strings cannot be coerced
 */
function compareVersions (ver1, operator, ver2) {
  if (!SUPPORTED_OPERATORS.includes(operator)) {
    throw new Error(`The '${operator}' comparison operator is not supported. ` +
      `Only '${JSON.stringify(SUPPORTED_OPERATORS)}' operators are supported`);
  }

  const semverOperator = ['==', '!='].includes(operator) ? '=' : operator;
  const result = semver.satisfies(coerceVersion(ver1), `${semverOperator}${coerceVersion(ver2)}`);
  return operator === '!=' ? !result : result;
}

/**
 * Add appropriate quotes to command arguments. See https://github.com/substack/node-shell-quote
 * for more details
 *
 * @param {string|Array<string>} - The arguments that will be parsed
 * @returns {string} - The arguments, quoted
 */
function quote (args) {
  return shellQuote(args);
}

export {
  hasValue, escapeSpace, escapeSpecialChars, localIp, cancellableDelay,
  multiResolve, safeJsonParse, wrapElement, unwrapElement, filterObject,
  toReadableSizeString, isSubPath, W3C_WEB_ELEMENT_IDENTIFIER,
  isSameDestination, compareVersions, coerceVersion, quote,
};
