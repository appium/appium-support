import _fs from 'fs';
import rimraf from './rimraf';
import { mkdir } from './util';
import _md5 from 'MD5';
import _ncp from 'ncp';
import B from 'bluebird';


let fs = {
  hasAccess: async function (path) {
    try {
      await this.access(path, fs.F_OK | fs.R_OK);
    } catch (err) {
      return false;
    }
    return true;
  },
  exists: function (path) { return this.hasAccess(path); },
  rimraf,
  mkdir,
  copyFile: B.promisify(_ncp)
};

const simples = ['open', 'close', 'mkdir', 'access', 'readFile', 'writeFile',
                 'write', 'readlink', 'chmod', 'unlink', 'readdir', 'stat', 'rename'];

for (let s of simples) {
  fs[s] = B.promisify(_fs[s]);
}

fs.md5 = async function (filePath) {
  return _md5(await fs.readFile(filePath));
};

export default fs;
