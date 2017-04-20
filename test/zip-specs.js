import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import B from 'bluebird';
import { extractAllTo, readEntries, toInMemoryZip } from '../lib/zip';
import { tempDir, fs } from '../index';

chai.use(chaiAsPromised);

describe('#zip', () => {
  let zipFilepath;

  beforeEach(() => {
    zipFilepath = path.resolve('test', 'assets', 'zip.zip');
  });

  describe('extractAllTo()', () => {
    it('should extract contents of a .zip file to a directory', async () => {
      const tempPath = await tempDir.openDir();
      await extractAllTo(zipFilepath, tempPath);
      await fs.readFile(path.resolve(tempPath, 'zip', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(tempPath, 'zip', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });

  describe('readEntries()', () => {
    it('should get a list of entries (directories and files) from zip file', async () => {
      const expectedEntries = ['zip/', 'zip/test-dir/', 'zip/test-dir/a.txt', 'zip/test-dir/b.txt'];
      let i = 0;
      await readEntries(zipFilepath, async ({entry}) => {
        await B.delay(10); 
        entry.fileName.should.equal(expectedEntries[i++]);
      });
    });
  });

  describe('toInMemoryZip()', () => {
    it('should convert a local file to an in-memory zip buffer', async () => {
      // Convert directory to in-memory buffer
      const testFolder = path.resolve('test', 'assets', 'zip');
      const buffer = await toInMemoryZip(testFolder);
      Buffer.isBuffer(buffer).should.be.true;

      // Write the buffer to a zip file
      const tempPath = await tempDir.openDir();
      await fs.writeFile(path.resolve(tempPath, 'test.zip'), buffer);

      // Unzip the file and test that it has the same contents as the directory that was zipped
      await extractAllTo(path.resolve(tempPath, 'test.zip'), path.resolve(tempPath, 'output'));
      await fs.readFile(path.resolve(tempPath, 'output', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(tempPath, 'output', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });
});
