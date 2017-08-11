import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import path from 'path';
import mockFS from 'mock-fs';
import * as zip from '../lib/zip';
import { tempDir, fs } from '../index';
import { MockReadWriteStream } from './helpers';
import sinon from 'sinon';

chai.use(chaiAsPromised);

describe('#zip', () => {
  let zippedFilepath, assetsPath;

  beforeEach(async () => {
    assetsPath = 'path/to/assets';
    zippedFilepath = path.resolve('test', 'assets', 'zip.zip');

    // Mock the filesystem to use in-memory
    mockFS({
      [assetsPath]: {
        'NotAZipFile.zip': '12345',
        'unzipped': {
          'a.txt': 'Hello World',
          'b.txt': 'Foo Bar',
        },
      },
    });

    // Hardcoded base64 zip
    const zippedBase64 = 'UEsDBAoAAAAAALlzk0oAAAAAAAAAAAAAAAAJABAAdW56aXBwZWQvVVgMANBO+VjO1vdY9QEUAFBLAwQKAAAAAADAc5NKAAAAAAAAAAAAAAAAEgAQAHVuemlwcGVkL3Rlc3QtZGlyL1VYDADQTvlY19b3WPUBFABQSwMEFAAIAAgAwnOTSgAAAAAAAAAAAAAAABcAEAB1bnppcHBlZC90ZXN0LWRpci9hLnR4dFVYDACDTvlY3Nb3WPUBFADzSM3JyVcIzy/KSQEAUEsHCFaxF0oNAAAACwAAAFBLAwQUAAgACADEc5NKAAAAAAAAAAAAAAAAFwAQAHVuemlwcGVkL3Rlc3QtZGlyL2IudHh0VVgMAINO+Vjf1vdY9QEUAHPLz1dwSiwCAFBLBwhIfrZJCQAAAAcAAABQSwECFQMKAAAAAAC5c5NKAAAAAAAAAAAAAAAACQAMAAAAAAAAAABA7UEAAAAAdW56aXBwZWQvVVgIANBO+VjO1vdYUEsBAhUDCgAAAAAAwHOTSgAAAAAAAAAAAAAAABIADAAAAAAAAAAAQO1BNwAAAHVuemlwcGVkL3Rlc3QtZGlyL1VYCADQTvlY19b3WFBLAQIVAxQACAAIAMJzk0pWsRdKDQAAAAsAAAAXAAwAAAAAAAAAAECkgXcAAAB1bnppcHBlZC90ZXN0LWRpci9hLnR4dFVYCACDTvlY3Nb3WFBLAQIVAxQACAAIAMRzk0pIfrZJCQAAAAcAAAAXAAwAAAAAAAAAAECkgdkAAAB1bnppcHBlZC90ZXN0LWRpci9iLnR4dFVYCACDTvlY39b3WFBLBQYAAAAABAAEADEBAAA3AQAAAAA=';
    zippedFilepath = path.resolve(assetsPath, 'zipped.zip');
    await fs.writeFile(zippedFilepath, zippedBase64, 'base64');
  });

  afterEach(() => {
    mockFS.restore();
  });

  describe('extractAllTo()', () => {
    it('should extract contents of a .zip file to a directory', async () => {
      await zip.extractAllTo(zippedFilepath, path.resolve(assetsPath));
      await fs.readFile(path.resolve(assetsPath, 'unzipped', 'test-dir', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(assetsPath, 'unzipped', 'test-dir', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });
  });

  describe('readEntries()', () => {
    const expectedEntries = [
      {name: 'unzipped/'},
      {name: 'unzipped/test-dir/'},
      {name: 'unzipped/test-dir/a.txt', contents: 'Hello World'},
      {name: 'unzipped/test-dir/b.txt', contents: 'Foo Bar'},
    ];

    it('should iterate entries (directories and files) of zip file', async () => {
      let i = 0;
      await zip.readEntries(zippedFilepath, async ({entry, extractEntryTo}) => {
        entry.fileName.should.equal(expectedEntries[i].name);

        // If it's a file, test that we can extract it to a temporary directory and that the contents are correct
        if (expectedEntries[i].contents) {
          await extractEntryTo(assetsPath);
          await fs.readFile(path.resolve(assetsPath, entry.fileName), {flags: 'r', encoding: 'utf8'}).should.eventually.equal(expectedEntries[i].contents);
        }
        i++;
      });
    });

    it('should stop iterating zipFile if onEntry callback returns false', async () => {
      let i = 0;
      await zip.readEntries(zippedFilepath, async () => {
        i++;
        return false;
      });
      i.should.equal(1);
    });

    it('should be rejected if it uses a non-zip file', async () => {
      let promise = zip.readEntries(path.resolve(assetsPath, 'NotAZipFile.zip'), async () => {});
      await promise.should.eventually.be.rejectedWith(/signature not found/);
    });
  });

  describe('toInMemoryZip()', () => {
    it('should convert a local file to an in-memory zip buffer', async () => {
      // Convert directory to in-memory buffer
      const testFolder = path.resolve(assetsPath, 'unzipped');
      const buffer = await zip.toInMemoryZip(testFolder);
      Buffer.isBuffer(buffer).should.be.true;

      // Write the buffer to a zip file
      await fs.writeFile(path.resolve(assetsPath, 'test.zip'), buffer);

      // Unzip the file and test that it has the same contents as the directory that was zipped
      await zip.extractAllTo(path.resolve(assetsPath, 'test.zip'), path.resolve(assetsPath, 'output'));
      await fs.readFile(path.resolve(assetsPath, 'output', 'a.txt'), {encoding: 'utf8'}).should.eventually.equal('Hello World');
      await fs.readFile(path.resolve(assetsPath, 'output', 'b.txt'), {encoding: 'utf8'}).should.eventually.equal('Foo Bar');
    });

    it('should be rejected if use a bad path', async () => {
      await zip.toInMemoryZip(path.resolve(assetsPath, 'bad_path')).should.be.rejectedWith(/Failed to zip/);
    });

    it('should be rejected if there is no access to the directory', async () => {
      let fsStub = sinon.stub(fs, 'hasAccess').returns(false);
      await zip.toInMemoryZip('/path/to/some/directory')
        .should.be.rejectedWith(/Failed to zip directory/);
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
