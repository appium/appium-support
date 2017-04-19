import B from 'bluebird';
import _ from 'lodash';
import os from 'os';
import path from 'path';
import nodeExtract from 'extract-zip';

const extract = B.promisify(nodeExtract);

async function extractAllTo (srcDir, destDir) {
  return await extract(srcDir, {dir: destDir});
}

function extractEntryTo (entry, entryPath) {
  throw `Not implemented`;
}

function archiveAllTo (dirname) {
  throw `Not implemented`;
}

function getZipBuffer (dirname) {
  throw `Not implemented`;
}

function getEntries () {
  throw `Not implemented`;
}

export { extractAllTo, extractEntryTo, archiveAllTo, getZipBuffer, getEntries };
