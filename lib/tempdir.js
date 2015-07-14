/* This library is originated from temp.js at http://github.com/bruce/node-temp */
import _fs from 'fs';
import os from 'os';
import nodePath from 'path';
import cnst from 'constants';
import B from 'bluebird';
import { getLogger } from 'appium-logger';

const logger = getLogger('Appium-Support');
import { hasAccess } from './util';
let fs = {
  open: B.promisify(_fs.open),
  mkdir: B.promisify(_fs.mkdir)
};

const RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

async function tempDir () {
  let now = new Date();
  let filePath = nodePath.join(os.tmpDir(),
    [now.getFullYear(), now.getMonth(), now.getDate(),
    '-',
    process.pid,
    '-',
    (Math.random() * 0x100000000 + 1).toString(36)].join(''));
  // creates a temp directory using the date and a random string 
  
  let exists = await hasAccess(filePath);
  // testing its accessibility to determine if the file exists already
  if (!exists) {
    fs.mkdir(filePath);
  }
  return filePath;
}

async function path (rawAffixes, defaultPrefix) {
  let affixes = parseAffixes(rawAffixes, defaultPrefix);
  let name = [affixes.prefix, affixes.suffix].join('');
  let tempDirectory = await tempDir();
  return nodePath.join(tempDirectory, name);
}

let open = async function (affixes) {
  let filePath = await  path(affixes, 'f-'); 
  try {
    let fd = await fs.open(filePath, RDWR_EXCL, 0o600);
    // opens the file in mode 384
    return {path: filePath, fd: fd};
  } catch (err) { 
    logger.errorAndThrow(err);
  }

}; 

function parseAffixes (rawAffixes, defaultPrefix) {
  let affixes = {prefix: null, suffix: null};
  if (rawAffixes) {
    switch (typeof(rawAffixes)) {
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

export { open, path };
