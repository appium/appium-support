import { util } from '..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import B from 'bluebird';
import sinon from 'sinon';
import os from 'os';
import path from 'path';
import { extractAllTo } from '../lib/zip';
import { tempDir, fs } from '../index';

let should = chai.should();
chai.use(chaiAsPromised);

describe.only('zip', () => {
  describe('extractAllTo', () => {
    const zipFilepath = path.resolve('test', 'assets', 'zip.zip');

    it('should extract contents of zip file', async () => {
      const tempPath = await tempDir.openDir();
      await extractAllTo(zipFilepath, tempPath);
      await fs.readFile(path.resolve(tempPath, 'zip', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(tempPath, 'zip', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });
});
