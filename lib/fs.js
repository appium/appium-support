import _fs from 'fs';
import B from 'bluebird';

let fs = {
  open: B.promisify(_fs.open),
  close: B.promisify(_fs.close),
  mkdir: B.promisify(_fs.mkdir),
  access: B.promisify(_fs.access),
  readlink: B.promisify(_fs.readlink),
  exists: B.promisify((path, done) => { _fs.exists(path, done.bind(null, null) ); }),
};

export default fs;
