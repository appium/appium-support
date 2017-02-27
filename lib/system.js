import { exec } from 'teen_process';
import os from 'os';

function isWindows () {
  return os.type() === 'Windows_NT';
}

function isMac () {
  return os.type() === 'Darwin';
}

function isLinux () {
  return !isWindows() && !isMac();
}

function isOSWin64 () {
  return process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432');
}

async function arch () {
  if (isLinux() || isMac()) {
    let {stdout} = await exec('uname', ['-m']);
    return stdout.trim() === 'i686' ? '32' : '64';
  } else if (isWindows()) {
    let is64 = this.isOSWin64();
    return is64 ? '64' : '32';
  }
}

async function macOsxVersion () {
  let stdout;
  try {
    stdout = (await exec('sw_vers', ['-productVersion'])).stdout.trim();
  } catch (err) {
    throw new Error(`Could not detect Mac OS X Version: ${err}`);
  }
  for (let v of ['10.8', '10.9', '10.10', '10.11', '10.12']) {
    if (stdout.indexOf(v) === 0) { return v; }
  }
  throw new Error(`Could not detect Mac OS X Version from sw_vers output: '${stdout}'`);
}

export { isWindows, isMac, isLinux, isOSWin64, arch, macOsxVersion };
