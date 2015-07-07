/* This library is originated from temp.js at http://github.com/bruce/node-temp */
import fs from 'fs';
import os from 'os';
import nodePath from 'path';
import cnst from 'constants';
import B from 'bluebird';
import { getLogger } from 'appium-logger';

const logger = getLogger('Appium-Support');
let promisifiedFsOpen = B.promisify(fs.open);

let RDWR_EXCL = cnst.O_CREAT | cnst.O_TRUNC | cnst.O_RDWR | cnst.O_EXCL;

function tempDir () {
  let now = new Date();
  let filePath = nodePath.join(os.tmpDir(),
    [now.getYear(), now.getMonth(), now.getDate(),
    '-',
    process.pid,
    '-',
    (Math.random() * 0x100000000 + 1).toString(36)].join(''));
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(filePath);
  }
  return filePath;
}

 function path (rawAffixes, defaultPrefix) {
  let affixes = parseAffixes(rawAffixes, defaultPrefix);
  let name = [affixes.prefix, affixes.suffix].join('');
  return nodePath.join(tempDir(), name);
}


let open = async function (affixes) {
  let filePath = path(affixes, 'f-'); 
  try {
    let fd = await promisifiedFsOpen(filePath, RDWR_EXCL, 384);
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
        throw ("Unknown affix declaration: " + affixes);
    }
  } else {
    affixes.prefix = defaultPrefix;
  }
  return affixes;
}

export { open, path };
