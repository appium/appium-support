// jshint ignore: start
import _fs from 'fs';
import rimraf from 'rimraf';
import md5file from 'md5-file';
import ncp from 'ncp';
import B from 'bluebird';
import mv from 'mv';
import which from 'which';
import glob from 'glob';


const md5 = B.promisify(md5file);

let fs = {
  async hasAccess (path) {
    try {
      await this.access(path, fs.F_OK | fs.R_OK);
    } catch (err) {
      return false;
    }
    return true;
  },
  exists (path) { return this.hasAccess(path); },
  rimraf: B.promisify(rimraf),
  async mkdir (dirName) {
    let _mkdir = B.promisify(_fs.mkdir);
    try {
      await _mkdir(dirName);
    } catch (err) {
      if (err && err.code !== "EEXIST") {
        throw err;
      }
    }
  },
  copyFile: B.promisify(ncp),
  async md5 (filePath) {
    return await md5(filePath);
  },
  mv: B.promisify(mv),
  which: B.promisify(which),
  glob: B.promisify(glob)
};

const simples = ['open', 'close', 'access', 'readFile', 'writeFile',
                 'write', 'read', 'readlink', 'chmod', 'unlink', 'readdir',
                 'stat', 'rename', 'lstat'];

for (let s of simples) {
  fs[s] = B.promisify(_fs[s]);
}

export default fs;
