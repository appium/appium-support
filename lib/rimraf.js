import _rimraf from 'rimraf';
import B from 'bluebird';

const rimraf = B.promisify(_rimraf);

export default rimraf;
