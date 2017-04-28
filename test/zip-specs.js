import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import { zip } from '..';
import { tempDir, fs } from '../index';
import nodeFS from 'fs';
import sinon from 'sinon';
import { MockReadWriteStream } from './helpers';

chai.use(chaiAsPromised);

describe('#zip', () => {
  let zippedFilepath;

  beforeEach(() => {
    zippedFilepath = path.resolve('test', 'assets', 'zip.zip');
  });

  describe('extractAllTo()', () => {
    it('should extract contents of a .zip file to a directory', async () => {
      const tempPath = await tempDir.openDir();
      await zip.extractAllTo(zippedFilepath, tempPath);
      await fs.readFile(path.resolve(tempPath, 'unzipped', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(tempPath, 'unzipped', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });

  describe('readEntries()', () => {
    let expectedEntries, tempPath;

    beforeEach(async () => {
      // The name and contents of the expected entries in the zip file (if no contents, then it's a dir)
      expectedEntries = [
        {name: 'unzipped/'},
        {name: 'unzipped/test-dir/'},
        {name: 'unzipped/test-dir/a.txt', contents: 'Hello World'},
        {name: 'unzipped/test-dir/b.txt', contents: 'Foo Bar'},
      ];
      tempPath = await tempDir.openDir();
    });

    it('should get a list of entries (directories and files) from zip file', async () => {
      let i = 0;
      await zip.readEntries(zippedFilepath, async ({entry, extractEntryTo}) => {
        entry.fileName.should.equal(expectedEntries[i].name);

        // If it's a file, test that we can extract it to a temporary directory and that the contents are correct
        if (expectedEntries[i].contents) {
          await extractEntryTo(tempPath);
          await fs.readFile(path.resolve(tempPath, entry.fileName), {flags: 'r', encoding: 'utf8'}).should.eventually.equal(expectedEntries[i].contents);
        }
        i++;
      });
    });

    it('should be rejected if it uses a non-zip file', async () => {
      let promise = zip.readEntries(path.resolve('test', 'assets', 'unzipped', 'test-dir', 'a.txt'), async () => {});
      await promise.should.eventually.be.rejectedWith(/signature not found/);
    });
  });

  describe('toInMemoryZip()', () => {
    it('should convert a local file to an in-memory zip buffer', async () => {
      // Convert directory to in-memory buffer
      const testFolder = path.resolve('test', 'assets', 'unzipped');
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

    it('should be rejected if createWriteStream emits an error', async () => {
      const mockStream = new MockReadWriteStream();
      mockStream.end = () => mockStream.emit('error', new Error('write stream error'));
      const writeStreamStub = sinon.stub(nodeFS, 'createWriteStream', () => mockStream);
      await zip.toInMemoryZip(path.resolve('test', 'assets', 'unzipped')).should.be.rejectedWith(/write stream error/);
      writeStreamStub.restore();
    });

    it('should be rejected if there is no access to the directory', async () => {
      let fsStub = sinon.stub(fs, 'hasAccess').returns(false);
      await zip.toInMemoryZip('/path/to/some/directory')
        .should.be.rejectedWith(/Unable to access directory/);
      fsStub.restore();
    });
  });

  describe('_extractEntryTo()', () => {
    let entry, mockZipFile, mockZipStream;
    beforeEach(async () => {
      entry = {fileName: path.resolve(await tempDir.openDir(), 'temp', 'file')};
      mockZipStream = new MockReadWriteStream();
      mockZipFile = {
        openReadStream: (entry, cb) => cb(null, mockZipStream), // eslint-disable-line promise/prefer-await-to-callbacks
      };
    });

    it('should be rejected if zip stream emits an error', async () => {
      mockZipStream.pipe = () => {
        mockZipStream.emit('error', new Error('zip stream error'));
      };
      await zip._extractEntryTo(mockZipFile, entry).should.be.rejectedWith('zip stream error');
    });

    it('should be rejected if write stream emits an error', async () => {
      mockZipStream.pipe = (writeStream) => {
        writeStream.emit('error', new Error('write stream error'));
        mockZipStream.end();
        writeStream.end();
      };
      await zip._extractEntryTo(mockZipFile, entry).should.be.rejectedWith('write stream error');
    });
  });

});
