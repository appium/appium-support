import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import * as util from '../lib/util';
import { tempDir, fs } from '../index';


chai.use(chaiAsPromised);

describe('#util', function () {
  let tmpRoot;
  let tmpFile;
  const content = 'YOLO';

  beforeEach(async function () {
    tmpRoot = await tempDir.openDir();
    tmpFile = path.resolve(tmpRoot, 'example.txt');
    await fs.writeFile(tmpFile, content, 'utf8');
  });

  afterEach(async function () {
    if (tmpRoot) {
      await fs.rimraf(tmpRoot);
    }
    tmpRoot = null;
  });

  describe('toInMemoryBase64()', function () {
    it('should convert a file to base64 encoding', async function () {
      const data = await util.toInMemoryBase64(tmpFile);
      const fileContent = await fs.readFile(tmpFile);
      data.toString().should.eql(fileContent.toString('base64'));
    });
  });

});
