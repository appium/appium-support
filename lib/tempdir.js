/* This library is originated from temp.js at http://github.com/bruce/node-temp */
import fs from './fs';
import os from 'os';
import nodePath from 'path';
import cnst from 'constants';
import log from './logger';

const RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

/**
 * @param {?string} tempRootDirectory A path to root directory for temporary space.
 *                                    Defaults to process.env.APPIUM_TMP_DIR.
 *                                    os.tmpdir() is called if process.env.APPIUM_TMP_DIR is undefined.
 *
 * @returns A path to the available directory
 */
async function tempDir (rootTmpDir = process.env.APPIUM_TMP_DIR) {
  const now = new Date();
  const filePath = nodePath.join(rootTmpDir || os.tmpdir(),
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
 * @param {?string} tempRootDirectory Respect tempRootDirectory if this is provided.
 *                               Defaults to process.env.APPIUM_TMP_DIR
 *                               {null|undefined} force ignore the rocess.env.APPIUM_TMP_DIR.
 * @returns {string} A path to the temp directory in tempRootDirectory
 */
async function path (rawAffixes, defaultPrefix, tempRootDirectory = process.env.APPIUM_TMP_DIR) {
  const affixes = parseAffixes(rawAffixes, defaultPrefix);
  const name = [affixes.prefix, affixes.suffix].join('');
  const tempDirectory = await tempDir(tempRootDirectory);
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
 * @param {?string} tempRootDirectory Respect tempRootDirectory if this is provided.
 *                               Defaults to process.env.APPIUM_TMP_DIR
 *                               {null|undefined} force ignore the rocess.env.APPIUM_TMP_DIR.
 * @returns {OpenedAffixes}
 */
async function open (affixes, tempRootDirectory = process.env.APPIUM_TMP_DIR) {
  const filePath = await path(affixes, 'f-', tempRootDirectory);
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
 * @param {?string} tempRootDirectory Respect tempRootDirectory if this is provided.
 *                               Defaults to process.env.APPIUM_TMP_DIR.
 *                               {null|undefined} force ignore the rocess.env.APPIUM_TMP_DIR.
 * @returns {string} A new tempDir() if tempRootDirectory is not provided
 */
async function openDir (tempRootDirectory = process.env.APPIUM_TMP_DIR) {
  const tempDirectory = await tempDir(tempRootDirectory);
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
