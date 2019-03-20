// jshint ignore: start
import _fs from 'fs';
import rimraf from 'rimraf';
import md5file from 'md5-file';
import ncp from 'ncp';
import B from 'bluebird';
import mv from 'mv';
import which from 'which';
import glob from 'glob';
import crypto from 'crypto';


const md5 = B.promisify(md5file);

let fs = {
  async hasAccess (path) {
    try {
      await this.access(path, _fs.R_OK);
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
      if (err && err.code !== 'EEXIST') {
        throw err;
      }
    }
  },
  async copyFile (source, destination, ...otherArgs) {
    if (!await this.hasAccess(source)) {
      throw new Error(`The file at '${source}' does not exist or is not accessible`);
    }
    return await (B.promisify(ncp))(source, destination, ...otherArgs);
  },
  async md5 (filePath) {
    return await md5(filePath);
  },
  mv: B.promisify(mv),
  which: B.promisify(which),
  glob: B.promisify(glob),
  async hash (filePath, algorithm = 'sha1') {
    return await new B((resolve, reject) => {
      const fileHash = crypto.createHash(algorithm);
      const readStream = _fs.createReadStream(filePath);
      readStream.on('error', (e) => reject(
        new Error(`Cannot calculate ${algorithm} hash for '${filePath}'. Original error: ${e.message}`)));
      readStream.on('data', (chunk) => fileHash.update(chunk));
      readStream.on('end', () => resolve(fileHash.digest('hex')));
    });
  },
};

// add the supported `fs` functions
const simples = [
  'open', 'close', 'access', 'readFile', 'writeFile', 'write', 'read',
  'readlink', 'chmod', 'unlink', 'readdir', 'stat', 'rename', 'lstat',
];
for (const s of simples) {
  fs[s] = B.promisify(_fs[s]);
}

// add the constants from `fs`
const constants = [
  'F_OK', 'R_OK', 'W_OK', 'X_OK', 'constants',
];
for (const c of constants) {
  fs[c] = _fs[c];
}

export { fs };
export default fs;
