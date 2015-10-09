import _mkdirp from 'mkdirp';
import B from 'bluebird';

async function mkdirp (dir) {
  return await new B((resolve, reject) => {
    _mkdirp(dir, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}
export { mkdirp };
