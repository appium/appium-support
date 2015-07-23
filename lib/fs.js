import _fs from 'fs';
import B from 'bluebird';

let fs = {
  open: B.promisify(_fs.open),
  close: B.promisify(_fs.close),
  mkdir: B.promisify(_fs.mkdir),
  access: B.promisify(_fs.access),
  hasAccess: async function (path) {
    try {
      await this.access(path, fs.F_OK | fs.R_OK);
    } catch (err) {
      return false;
    }
    return true;
  },
  exists: function (path) { return this.hasAccess(path); },
  readlink: B.promisify(_fs.readlink),
};

export default fs;
