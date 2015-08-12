import chai from 'chai';
import path from 'path';
import { plist } from '../..';


chai.should();

describe('plist', () => {
  it('parsePlistFile as binary', async () => {
    let plistPath = path.resolve(__dirname, '..', '..', 'test', 'assets', 'sample.plist');
    let content = await plist.parsePlistFile(plistPath);
    content.should.have.property('com.apple.locationd.bundle-/System/Library/PrivateFrameworks/Parsec.framework');
  });
});
