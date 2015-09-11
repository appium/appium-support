
import { tempDir, fs } from '../index.js';
import chai from 'chai';

chai.should();

describe('tempdir', function () {
  it('should be able to generate a path', async () => {
    let path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'});
    path.should.exist;
    path.should.include('myfile.tmp');
  });

  it('should be able to create a temp file', async () => {
    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'});
    res.should.exist;
    res.path.should.exist;
    res.path.should.include('my-test-file.zip');
    res.fd.should.exist;
    await fs.exists(res.path).should.eventually.be.ok;
  });

  it('should generate a random temp dir', async () => {
    let res = await tempDir.openDir();
    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    let res2 = await tempDir.openDir();
    await fs.exists(res2).should.eventually.be.ok;
    res.should.not.equal(res2);
  });

  it('should generate one temp dir used for the life of the process', async () => {
    let res = await tempDir.staticDir();
    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    let res2 = await tempDir.staticDir();
    await fs.exists(res2).should.eventually.be.ok;
    res.should.equal(res2);
  });
});
