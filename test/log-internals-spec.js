import chai from 'chai';
import fs from '../index';
import os from 'os';
import { SecureValuesPreprocessor } from '../lib/log-internal';


chai.should();


describe('Log Internals', function () {
  it('should parse plist file as binary', async function () {
    let content = await plist.parsePlistFile(binaryPlistPath);
    content.should.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
  });

});
