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
  var xmlContent = await fs.readFile(plistFilename, 'utf8');
  return  xmlplist.parse(xmlContent);
}

async function parsePlistFile (plist, mustExist = true) {
  log.debug(`Attempting to parse plist file '${plist}'`);
  let obj = {}; 
  let exists = await fs.exists(plist);
  // handle nonexistant file
  if (!exists) {
    if (mustExist) {
      log.errorAndThrow(`plist file doesn't exist`);            
    } else {
      log.debug(`File doesn't exist. Returning an empty plist.`);
      return obj;
    }
  }
  try {
    obj = await parseFile(plist);
  } catch (ign) {
    log.debug('Could not parse plist file as binary');
    log.debug('Will try to parse the plist file as XML');
    try {
      obj = await parseXmlPlistFile(plist);
    } catch (err) {
      log.errorAndThrow(`Could not parse plist file as XML: ${err.message}`);
    }
    log.debug('Parsed file as XML');
    return obj;
  }
  if (obj.length) {
    log.debug('Parsed plist file as binary');
    return obj[0];
  } else {
    throw new Error(`Binary file ${plist} appears to be empty`);
  }
}

async function updatePlistFile (plist, updatedFields, binary = true, mustExist = true) {
  log.debug(`Attempting to update plist file'${plist}'`);
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
  log.debug(`Wrote plist file '${plist}'`);
}

export { parsePlistFile, updatePlistFile };
