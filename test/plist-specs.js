import chai from 'chai';
import path from 'path';
import { plist, tempDir, fs } from '../index.js';


chai.should();

const plistPath = path.resolve('test', 'assets', 'sample.plist');

describe('plist', function () {
  it('should parse plist file as binary', async function () {
    let content = await plist.parsePlistFile(plistPath);
    content.should.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
  });

  it(`should return an empty object if file doesn't exist and mustExist is set to false`, async function () {
    let mustExist = false;
    let content = await plist.parsePlistFile('doesntExist.plist', mustExist);
    content.should.be.an.Object;
    content.should.be.empty;
  });

  it('should write plist file as binary', async function () {
    // create a temporary file, to which we will write
    let plistFile = path.resolve(await tempDir.openDir(), 'sample.plist');
    await fs.copyFile(plistPath, plistFile);

    // write some data
    let updatedFields = {
      'io.appium.test': true
    };
    await plist.updatePlistFile(plistFile, updatedFields, true);

    // make sure the data is there
    let content = await plist.parsePlistFile(plistFile);
    content.should.have.property('io.appium.test');
  });
});
