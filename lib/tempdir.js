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
 *                               Defaults to process.env.APPIUM_TEMP_DIR
 *                               {null|undefined} force ignore the rocess.env.APPIUM_TEMP_DIR.
 * @returns {string} A path to the temp directory in tempDirectory
 */
async function path (rawAffixes, defaultPrefix, tempDirectory = process.env.APPIUM_TEMP_DIR) {
  let affixes = parseAffixes(rawAffixes, defaultPrefix);
  let name = [affixes.prefix, affixes.suffix].join('');
  if (!tempDirectory) {
    tempDirectory = await tempDir();
    log.debug(`Create a new tempDir in '${tempDirectory}'`);
  } else {
    log.debug(`Use given tempDirectory in '${tempDirectory}'`);
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
 * @param {?string} tempDirectory Respect tempDirectory if this is provided.
 *                               Defaults to process.env.APPIUM_TEMP_DIR
 *                               {null|undefined} force ignore the rocess.env.APPIUM_TEMP_DIR.
 * @returns {OpenedAffixes}
 */
async function open (affixes, tempDirectory = process.env.APPIUM_TEMP_DIR) {
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

/**
 * Returns a new path to temp directory every call
 * @param {?string} tempDirectory Respect tempDirectory if this is provided.
 *                               Defaults to process.env.APPIUM_TEMP_DIR.
 *                               {null|undefined} force ignore the rocess.env.APPIUM_TEMP_DIR.
 * @returns {string} A new tempDir() if tempDirectory is not provided
 */
async function openDir (tempDirectory = process.env.APPIUM_TEMP_DIR) {
  if (!tempDirectory) {
    tempDirectory = await tempDir();
    log.debug(`Create a new tempDir in '${tempDirectory}'`);
  } else {
    log.debug(`Use given tempDirectory in '${tempDirectory}'`);
  }
  return tempDirectory;
}

/**
 * Returns a path to temp directory whcih is static in the same process.
 * @returns {string} A temp directory path which is static in the same process.
 */
async function staticDir () { // eslint-disable-line require-await
  return _static;
}

export { open, path, openDir, staticDir };
