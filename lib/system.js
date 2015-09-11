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

function isOSWin64() {
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

export { isWindows, isMac, isLinux, isOSWin64, arch };
