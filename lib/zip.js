import B from 'bluebird';
import nodeExtract from 'extract-zip';
import yauzl from 'yauzl';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import path from 'path';
import { mkdirp } from '../lib/mkdirp';
import stream from 'stream';
import fs from './fs';

const extract = B.promisify(nodeExtract);
const open = B.promisify(yauzl.open);
const ZIP_MAGIC = 'PK';

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
      const res = await onEntry({entry, extractEntryTo: (destDir) => _extractEntryTo(zipfile, entry, destDir)});
      if (res === false) {
        return zipfile.emit('end');
      }
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
  // Create a writable stream that zip buffers will be streamed to
  const zipBufferArr = [];
  const zipWriteStream = new stream.Writable({
    write: (buffer, encoding, next) => {
      zipBufferArr.push(buffer);
      next();
    },
  });
  const zipWriteStreamPromise = new B((resolve) => {
    // Don't need to do error handling since this writeStream is in-memory and doesn't emit any errors
    zipWriteStream.once('finish', resolve);
  });

  // Zip 'srcDir' and stream it to the above writable stream
  const archive = archiver('zip', {
    zlib: {level: 9}
  });
  const archiveStreamPromise = new B((resolve, reject) => {
    archive.once('finish', resolve);
    archive.once('error', (errStr) => reject(new Error(`Failed to zip directory ${srcDir}: ${errStr}`)));
  });
  archive.directory(srcDir, false);
  archive.pipe(zipWriteStream);
  archive.finalize();

  // Wait for the streams to finish
  await B.all([archiveStreamPromise, zipWriteStreamPromise]);

  // Return the array of zip buffers concatenated into one buffer
  return Buffer.concat(zipBufferArr);
}

/**
 * Verifies whether the given file is a valid ZIP archive
 *
 * @param {string} filePath - Full path to the file
 * @throws {Error} If the file does not exist or is not a valid ZIP archive
 */
async function assertValidZip (filePath) {
  if (!await fs.exists(filePath)) {
    throw new Error(`The file at '${filePath}' does not exist`);
  }

  const {size} = await fs.stat(filePath);
  if (size < 4) {
    throw new Error(`The file at '${filePath}' is too small to be a ZIP archive`);
  }
  const fd = await fs.open(filePath, 'r');
  try {
    const buffer = Buffer.alloc(ZIP_MAGIC.length);
    await fs.read(fd, buffer, 0, ZIP_MAGIC.length, 0);
    const signature = buffer.toString('ascii');
    if (signature !== ZIP_MAGIC) {
      throw new Error(`The file signature '${signature}' of '${filePath}' ` +
        `is not equal to the expected ZIP archive signature '${ZIP_MAGIC}'`);
    }
    return true;
  } finally {
    await fs.close(fd);
  }
}

export { extractAllTo, readEntries, toInMemoryZip, _extractEntryTo, assertValidZip };
export default { extractAllTo, readEntries, toInMemoryZip, assertValidZip };
