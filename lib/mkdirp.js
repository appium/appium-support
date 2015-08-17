import _mkdirp from 'mkdirp';
import B from 'bluebird';

let mkdirp = B.promisify(_mkdirp);
export { mkdirp };
