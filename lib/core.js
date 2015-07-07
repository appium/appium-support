
import child_process from 'child_process';
import B from 'bluebird';

let exec = B.promisify(child_process.exec);

export { exec };