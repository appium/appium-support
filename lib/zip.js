import B from 'bluebird';
import nodeExtract from 'extract-zip';
import yauzl from 'yauzl';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import path from 'path';
import { mkdirp } from '../lib/mkdirp';
import * as tempDir from '../lib/tempdir';
import * as fs from '../lib/fs';

const extract = B.promisify(nodeExtract);
const open = B.promisify(yauzl.open);

/**
 * Extract zipfile to a directory
 * @param {string} zipFilepath
 * @param {string} destDir
 */
async function extractAllTo (zipFilepath, destDir) {
  return await extract(zipFilepath, {dir: destDir});
}

/**
 * Extract a single zip entry to a directory
 * @param {Streamable} zipfile
 * @param {Object} entry
 * @param {str} destDir
 */
async function _extractEntryTo (zipfile, entry, destDir) {

  // Create dest directory if doesn't exist already
  await mkdirp(path.resolve(destDir, path.dirname(entry.fileName)));

  // Create a write stream
  const writeStream = createWriteStream(path.resolve(destDir, entry.fileName), {flags: 'w'});
  const writeStreamPromise = new B((resolve, reject) => {
    writeStream.once('finish', resolve);
    writeStream.once('error', reject);
  });

  // Create zipReadStream and pipe data to the write stream
  // (for some odd reason B.promisify doesn't work on zipfile.openReadStream, it causes an error 'closed')
  const zipReadStream = await new B((resolve, reject) => {
    zipfile.openReadStream(entry, (err, readStream) => err ? reject(err) : resolve(readStream));
  });
  const zipReadStreamPromise = new B((resolve, reject) => {
    zipReadStream.once('end', resolve);
    zipReadStream.once('error', reject);
  });
  zipReadStream.pipe(writeStream);

  // Wait for the zipReadStream and writeStream to end before returning
  return await B.all([
    zipReadStreamPromise,
    writeStreamPromise,
  ]);
}

/**
 * Get entries for a zip folder
 * @param {string} srcDir
 * @param {function} onEntry Callback when entry is read
 * @param {function} onError Callback when error occurs
 */
async function readEntries (zipFilepath, onEntry) {

  // Open a zip file and start reading entries
  const zipfile = await open(zipFilepath, {lazyEntries: true});
  const zipReadStreamPromise = new B((resolve, reject) => {
    zipfile.once('end', resolve);
    zipfile.once('error', reject);

    // On each entry, call 'onEntry' and then read the next entry
    zipfile.on('entry', async (entry) => {
      await onEntry({entry, extractEntryTo: (destDir) => _extractEntryTo(zipfile, entry, destDir)});
      zipfile.readEntry();
    });
  });
  zipfile.readEntry();

  // Wait for the entries to finish being iterated through
  return await zipReadStreamPromise;
}

/**
 * Converts contents of local directory to an in-memory .zip buffer
 * @param {*} srcDir
 */
async function toInMemoryZip (srcDir) {
  if (!await fs.hasAccess(srcDir)) {
    throw new Error(`Unable to access directory '${srcDir}'`);
  }
  // Create a writable stream that zip will be streamed to
  const zipfilePath = path.resolve(await tempDir.openDir(), 'temp.zip');
  const zipWriteStream = createWriteStream(zipfilePath);
  const zipWriteStreamPromise = new B((resolve, reject) => {
    zipWriteStream.once('finish', resolve);
    zipWriteStream.once('error', reject);
  });

  // Zip 'srcDir' and stream it to the above writable stream
  const archive = archiver('zip', {
    zlib: {level: 9}
  });
  archive.once('error', (err) => { throw err; }); // eslint-disable-line promise/prefer-await-to-callbacks
  archive.directory(srcDir, false);
  archive.pipe(zipWriteStream);
  archive.finalize();

  // Wait for the stream to finish
  await zipWriteStreamPromise;

  // Return buffer contents of writable stream
  return await fs.readFile(zipfilePath);
}

export { extractAllTo, readEntries, toInMemoryZip, _extractEntryTo };
export default { extractAllTo, readEntries, toInMemoryZip, _extractEntryTo };
