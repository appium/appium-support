
import { exec } from 'teen_process';
import os from 'os';
import { getLogger } from 'appium-logger';
let osType = os.type();

const logger = getLogger('Appium-Support');

export function isWindows () {
  return osType === 'Windows_NT';
}

export function isMac () {
  return osType === 'Darwin';
}

export function isLinux () {
  return !exports.isWindows() && !exports.isMac();
}

export async function arch () { 
  try {
    let {stdout} = await exec('uname', ['-m']);
    
    if (stdout.trim() === 'i686') {
      return '32'; 
    } else {
      return '64';
    }
  } catch (err) {
    logger.errorAndThrow(err); 
  }
}
