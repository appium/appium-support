/* This library is originated from temp.js at http://github.com/bruce/node-temp */
import fs from './fs';
import os from 'os';
import nodePath from 'path';
import cnst from 'constants';
import log from './logger';

const RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

/**
 * @returns A path to the available directory
 */
async function tempDir () {
  let now = new Date();
  let filePath = nodePath.join(os.tmpdir(),
    [
      now.getFullYear(), now.getMonth(), now.getDate(),
      '-',
      process.pid,
      '-',
      (Math.random() * 0x100000000 + 1).toString(36),
    ].join(''));
  // creates a temp directory using the date and a random string

  await fs.mkdir(filePath);

  return filePath;
}

/**
 * @typedef {Object} Affixes
 * @property {string} prefix - prefix of the temp directory name
 * @property {string} suffix - suffix of the temp directory name
 */

/**
 * @param {string|Affixes} rawAffixes
 * @param {?string} defaultPrefix
 * @param {?string} tempDirectory Respect tempDirectory if this is provided.
 * @returns {string} A path to the temp directory in tempDirectory
 */
async function path (rawAffixes, defaultPrefix, tempDirectory = null) {
  let affixes = parseAffixes(rawAffixes, defaultPrefix);
  let name = [affixes.prefix, affixes.suffix].join('');
  if (!tempDirectory) {
    tempDirectory = await tempDir();
  }
  return nodePath.join(tempDirectory, name);
}

/**
 * @typedef {Object} OpenedAffixes
 * @property {string} path - The path to file
 * @property {integer} fd - The file descriptor opened
 */

/**
 *
 * @param {Affixes} affixes
 * @param {string} tempDirectory
 * @returns {OpenedAffixes}
 */
async function open (affixes, tempDirectory = null) {
  let filePath = await path(affixes, 'f-', tempDirectory);
  try {
    let fd = await fs.open(filePath, RDWR_EXCL, 0o600);
    // opens the file in mode 384
    return {path: filePath, fd};
  } catch (err) {
    log.errorAndThrow(err);
  }
}

/**
 *
 * @param {string|Affixes} rawAffixes
 * @param {?string} defaultPrefix
 * @returns {Affixes}
 */
function parseAffixes (rawAffixes, defaultPrefix) {
  let affixes = {prefix: null, suffix: null};
  if (rawAffixes) {
    switch (typeof rawAffixes) {
      case 'string':
        affixes.prefix = rawAffixes;
        break;
      case 'object':
        affixes = rawAffixes;
        break;
      default:
        throw new Error(`Unknown affix declaration: ${affixes}`);
    }
  } else {
    affixes.prefix = defaultPrefix;
  }
  return affixes;
}

const _static = tempDir();
const openDir = tempDir;

/**
 * Returns a path to temp directory
 * @param {string} tempDirectory
 * @returns {string} A new tempDir() if tempDirectory is not provided
 */
async function staticDir (tempDirectory = null) { // eslint-disable-line require-await
  if (!tempDirectory) {
    return _static;
  }
  return tempDirectory;
}

export { open, path, openDir, staticDir };
