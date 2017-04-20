import B from 'bluebird';
import nodeExtract from 'extract-zip';
import yauzl from 'yauzl';
import archiver from 'archiver';
import { createWriteStream } from 'fs';
import path from 'path';
import { tempDir, fs } from '..';

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
 * Get entries for a zip folder
 * @param {string} srcDir 
 * @param {function} onEntry Callback when entry is read
 * @param {function} onError Callback when error occurs
 */
async function readEntries (srcDir, onEntry) {
  const entries = [];
  const zipfile = await open(srcDir, {lazyEntries: true});
  return new B((resolve, reject) => {
    zipfile.readEntry();
    zipfile.on('entry', async (entry) => {
      await onEntry({entry, zipfile});
      zipfile.readEntry();
    });
    zipfile.once('error', reject);
    zipfile.once('end', () => resolve(entries));
  });
}

/**
 * Converts contents of local directory to an in-memory .zip file
 * @param {*} srcDir 
 */
async function toInMemoryZip (srcDir) {
  const tempOutputDir = await tempDir.openDir();
  return new B((resolve, reject) => {
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    const output = createWriteStream(path.resolve(tempOutputDir, 'temp.zip'));
    output.on('finish', async () => {
      try {
        const zipContents = await fs.readFile(path.resolve(tempOutputDir, 'temp.zip'));
        resolve(zipContents);
      } catch (err) { reject(err); }
    });
    archive.on('error', reject);
    archive.directory(srcDir, false);
    archive.pipe(output);
    archive.finalize();
  });
}

export { extractAllTo, readEntries, toInMemoryZip };
