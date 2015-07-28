import _fs from 'fs';
import rimraf from './rimraf';
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
  copyFile: B.promisify(_ncp),
};

const simples = ['open', 'close', 'mkdir', 'access', 'readFile', 'writeFile',
                 'readlink', 'chmod'];

for (let s of simples) {
  fs[s] = B.promisify(_fs[s]);
}

export default fs;
