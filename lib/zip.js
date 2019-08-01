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
 *
 * @param {string} zipFilePath The full path to the source ZIP file
 * @param {string} destDir The full path to the destination folder
 */
async function extractAllTo (zipFilePath, destDir) {
  return await extract(zipFilePath, {dir: destDir});
}

/**
 * Extract a single zip entry to a directory
 *
 * @param {Streamable} zipFile The source ZIP stream
 * @param {yauzl.ZipEntry} entry The entry instance
 * @param {string} destDir The full path to the destination folder
 */
async function _extractEntryTo (zipFile, entry, destDir) {
  const dstPath = path.resolve(destDir, entry.fileName);

  // Create dest directory if doesn't exist already
  if (/\/$/.test(entry.fileName)) {
    if (!await fs.exists(dstPath)) {
      await mkdirp(dstPath);
    }
    return;
  } else if (!await fs.exists(path.dirname(dstPath))) {
    await mkdirp(path.dirname(dstPath));
  }

  // Create a write stream
  const writeStream = createWriteStream(dstPath, {flags: 'w'});
  const writeStreamPromise = new B((resolve, reject) => {
    writeStream.once('finish', resolve);
    writeStream.once('error', reject);
  });

  // Create zipReadStream and pipe data to the write stream
  // (for some odd reason B.promisify doesn't work on zipfile.openReadStream, it causes an error 'closed')
  const zipReadStream = await new B((resolve, reject) => {
    zipFile.openReadStream(entry, (err, readStream) => err ? reject(err) : resolve(readStream));
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
 * @typedef {Object} ZipEntry
 * @property {yauzl.ZipEntry} entry The actual entry instance
 * @property {function} extractEntryTo An async function, which accepts one parameter.
 * This parameter contains the destination folder path to which this function is going to extract the entry.
 */

/**
 * Get entries for a zip folder
 *
 * @param {string} zipFilePath The full path to the source ZIP file
 * @param {function} onEntry Callback when entry is read.
 * The callback is expected to accept one argument of ZipEntry type.
 * The iteration through the source zip file will bi terminated as soon as
 * the result of this function equals to `false`.
 */
async function readEntries (zipFilePath, onEntry) {
  // Open a zip file and start reading entries
  const zipfile = await open(zipFilePath, {lazyEntries: true});
  const zipReadStreamPromise = new B((resolve, reject) => {
    zipfile.once('end', resolve);
    zipfile.once('error', reject);

    // On each entry, call 'onEntry' and then read the next entry
    zipfile.on('entry', async (entry) => {
      const res = await onEntry({
        entry,
        extractEntryTo: async (destDir) => await _extractEntryTo(zipfile, entry, destDir)
      });
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
 *
 * @param {string} srcDir The full path to the folder being zipped
 * @returns {Buffer} Zipped content of the source folder as memory buffer
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

/**
 * @typedef {Object} ZipCompressionOptions
 * @property {number} level [9] - Compression level in range 0..9
 * (greater numbers mean better compression, but longer processing time)
 */

/**
 * @typedef {Object} ZipSourceOptions
 * @property {!string} pattern ['**\/*'] - GLOB pattern for compression
 * @property {!string} cwd - The source root folder (the parent folder of
 * the destination file by default)
 * @property {?Array<string>} ignore - The list of ignored patterns
 */

/**
 * Creates an archive based on the given glob pattern
 *
 * @param {string} dstPath - The resulting archive path
 * @param {ZipSourceOptions} src - Source options
 * @param {ZipCompressionOptions} opts - Compression options
 * @throws {Error} If there was an error while creating the archive
 */
async function toArchive (dstPath, src = {}, opts = {}) {
  const {
    level = 9,
  } = opts;
  const {
    pattern = '**/*',
    cwd = path.dirname(dstPath),
    ignore = [],
  } = src;
  const archive = archiver('zip', { zlib: { level }});
  const stream = fs.createWriteStream(dstPath);
  return await new B((resolve, reject) => {
    archive
      .glob(pattern, {
        cwd,
        ignore,
      })
      .on('error', reject)
      .pipe(stream);
    stream.on('close', resolve);
    archive.finalize();
  });
}

export { extractAllTo, readEntries, toInMemoryZip, _extractEntryTo,
  assertValidZip, toArchive };
export default { extractAllTo, readEntries, toInMemoryZip, assertValidZip, toArchive };
