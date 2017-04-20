import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { zip } from '..';
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
      await zip.extractAllTo(zipFilepath, tempPath);
      await fs.readFile(path.resolve(tempPath, 'zip', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(tempPath, 'zip', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });

  describe('readEntries()', () => {
    it('should get a list of entries (directories and files) from zip file', async () => {

      // The name and contents of the expected entries in the zip file (if no contents, then it's a dir)
      const expectedEntries = [
        {name: 'zip/'}, 
        {name: 'zip/test-dir/'},
        {name: 'zip/test-dir/a.txt', contents: 'Hello World'}, 
        {name: 'zip/test-dir/b.txt', contents: 'Foo Bar'},
      ];
      let i = 0;
      const tempPath = await tempDir.openDir();

      await zip.readEntries(zipFilepath, async ({entry, extractEntryTo}) => {
        entry.fileName.should.equal(expectedEntries[i].name);

        // If it's a file, test that we can extract it to a temporary directory and that the contents are correct
        if (expectedEntries[i].contents) {
          await extractEntryTo(tempPath);
          await fs.readFile(path.resolve(tempPath, entry.fileName), {flags: 'r', encoding: 'utf8'}).should.eventually.equal(expectedEntries[i].contents); 
        }
        i++;
      });
    });
  });

  describe('toInMemoryZip()', () => {
    it('should convert a local file to an in-memory zip buffer', async () => {
      // Convert directory to in-memory buffer
      const testFolder = path.resolve('test', 'assets', 'zip');
      const buffer = await zip.toInMemoryZip(testFolder);
      Buffer.isBuffer(buffer).should.be.true;

      // Write the buffer to a zip file
      const tempPath = await tempDir.openDir();
      await fs.writeFile(path.resolve(tempPath, 'test.zip'), buffer);

      // Unzip the file and test that it has the same contents as the directory that was zipped
      await zip.extractAllTo(path.resolve(tempPath, 'test.zip'), path.resolve(tempPath, 'output'));
      await fs.readFile(path.resolve(tempPath, 'output', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(tempPath, 'output', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });
});
