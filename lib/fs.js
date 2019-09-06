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
import path from 'path';


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
  /** The callback function which will be called during the directory walking
   * @name WalkDirCallback
   * @function
   * @param {string} itemPath The path of the file or folder
   * @param {boolean} isDirectory Shows if it is a directory or a file
   * @return {boolean} return true if you wan't to stop wakling
  */

  /**
   * Walks a directory given according to the paramters given. The callback will be invoked with a path joined with the dir parameter
   * @param {string} dir Directory path where we will start walking
   * @param {boolean} recursive Set it to true if you wan't to continue walking sub directories
   * @param {WalkDirCallback} callback The callback to be called when a new path is found
   * @return {?string} returns the found path or null if the item was not found
   */
  async walkDir (dir, recursive, callback) { //eslint-disable-line promise/prefer-await-to-callbacks
    for (const item of await fs.readdir(dir)) {
      const itemPath = path.join(dir, item);
      const isDirectory = (await fs.stat(itemPath)).isDirectory();
      const found = await callback(itemPath, isDirectory); //eslint-disable-line promise/prefer-await-to-callbacks
      if (found) {
        return itemPath;
      }
      if (isDirectory && recursive) {
        const foundPath = await this.walkDir(itemPath, recursive, callback);
        if (foundPath) {
          return foundPath;
        }
      }
    }
    return null;
  }
};

// add the supported `fs` functions
const simples = [
  'open', 'close', 'access', 'readFile', 'writeFile', 'write', 'read',
  'readlink', 'chmod', 'unlink', 'readdir', 'stat', 'rename', 'lstat',
];
for (const s of simples) {
  fs[s] = B.promisify(_fs[s]);
}

const syncFunctions = [
  'createReadStream',
  'createWriteStream',
];
for (const s of syncFunctions) {
  fs[s] = _fs[s];
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
