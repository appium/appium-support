import _rimraf from 'rimraf';
import B from 'bluebird';

// DEPRECATED, use fs.rimraf instead
const rimraf = B.promisify(_rimraf);

export default rimraf;
