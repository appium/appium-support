import xmlplist from 'plist';
import bplistCreate from 'bplist-creator';
import bplistParse from 'bplist-parser';
import fs from './fs';
import log from './logger';
import _ from 'lodash';
import B from 'bluebird';


let parseFile = B.promisify(bplistParse.parseFile);

// XML Plist library helper
async function parseXmlPlistFile (plistFilename) {
  let xmlContent = await fs.readFile(plistFilename, 'utf8');
  return xmlplist.parse(xmlContent);
}

async function parsePlistFile (plist, mustExist = true, quiet = true) {
  // handle nonexistant file
  if (!await fs.exists(plist)) {
    if (mustExist) {
      log.errorAndThrow(`Plist file doesn't exist: '${plist}'`);
    } else {
      log.debug(`Plist file '${plist}' does not exist. Returning an empty plist.`);
      return {};
    }
  }

  let obj = {};
  let type = 'binary';
  try {
    obj = await parseFile(plist);
    if (obj.length) {
      obj = obj[0];
    } else {
      throw new Error(`Binary file '${plist}'' appears to be empty`);
    }
  } catch (ign) {
    try {
      obj = await parseXmlPlistFile(plist);
      type = 'xml';
    } catch (err) {
      log.errorAndThrow(`Could not parse plist file '${plist}' as XML: ${err.message}`);
    }
  }

  if (!quiet) {
    log.debug(`Parsed plist file '${plist}' as ${type}`);
  }
  return obj;
}

async function updatePlistFile (plist, updatedFields, binary = true, mustExist = true, quiet = true) {
  let obj;
  try {
    obj = await parsePlistFile(plist, mustExist);
  } catch (err) {
    log.errorAndThrow(`Could not update plist: ${err.message}`);
  }
  _.extend(obj, updatedFields);
  let newPlist = binary ? bplistCreate(obj) : xmlplist.build(obj);
  try {
    await fs.writeFile(plist, newPlist);
  } catch (err) {
    log.errorAndThrow(`Could not save plist: ${err.message}`);
  }
  if (!quiet) {
    log.debug(`Wrote plist file '${plist}'`);
  }
}

export { parsePlistFile, updatePlistFile };
