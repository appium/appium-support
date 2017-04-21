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
 * Extract directory to a zip folder
 * @param {*} srcDir 
 * @param {*} destDir 
 */
async function extractAllTo (srcDir, destDir) {
  return await extract(srcDir, {dir: destDir});
}

/**
 * Extract a zip entry to a directory
 * @param {Streamable} zipfile 
 * @param {Object} entry 
 * @param {str} destDir 
 */
async function _extractEntryTo (zipfile, entry, destDir) {
  // Create directory if doesn't exist already
  const relDir = path.dirname(entry.fileName);
  await mkdirp(path.resolve(destDir, relDir));
  
  // Stream the contents of the entry to a file
  return new B((resolve) => {
    zipfile.openReadStream(entry, (err, readStream) => {
      const writeStream = createWriteStream(path.resolve(destDir, entry.fileName), {flags: 'w'});  
      readStream.pipe(writeStream);
      readStream.on('end', resolve);
    });
  });
}

/**
 * Get entries for a zip folder
 * @param {string} srcDir 
 * @param {function} onEntry Callback when entry is read
 * @param {function} onError Callback when error occurs
 */
async function readEntries (srcDir, onEntry) {
  const zipfile = await open(srcDir, {lazyEntries: true});
  return new B((resolve, reject) => {
    zipfile.readEntry();

    zipfile.on('entry', async (entry) => {
      await onEntry({entry, extractEntryTo: (destDir) => _extractEntryTo(zipfile, entry, destDir)});
      zipfile.readEntry();
    });

    zipfile.once('error', reject);
    zipfile.once('end', resolve);
  });
}

/**
 * Converts contents of local directory to an in-memory .zip buffer
 * @param {*} srcDir 
 */
async function toInMemoryZip (srcDir) {
  const tempOutputDir = await tempDir.openDir();
  return new B((resolve, reject) => {
    // Create a writable stream that zip is streamed to 
    const output = createWriteStream(path.resolve(tempOutputDir, 'temp.zip'));
    output.on('finish', async () => {
      try {
        const zipContents = await fs.readFile(path.resolve(tempOutputDir, 'temp.zip'));
        resolve(zipContents);
      } catch (err) { reject(err); }
    });

    // Start streaming zip data to the above writable stream
    const archive = archiver('zip', {
      zlib: { level: 9 }    
    });
    archive.on('error', reject);
    archive.directory(srcDir, false);
    archive.pipe(output);
    archive.finalize();
  });
}

export { extractAllTo, readEntries, toInMemoryZip };
export default { extractAllTo, readEntries, toInMemoryZip };