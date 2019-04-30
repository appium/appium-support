
import { tempDir, fs } from '../index.js';
import chai from 'chai';
import nodePath from 'path';

chai.should();

describe('tempdir', function () {
  it('should be able to generate a path', async function () {
    const path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'});
    path.should.exist;
    path.should.include('myfile.tmp');
  });

  it('should be able to generate a path with tempDirectory', async function () {
    const preDirPath = await tempDir.staticDir();

    const path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'}, undefined, preDirPath);
    path.should.exist;
    path.should.equal(nodePath.join(preDirPath, 'myfile.tmp'));
  });

  it('should be able to create a temp file', async function () {
    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'});
    res.should.exist;
    res.path.should.exist;
    res.path.should.include('my-test-file.zip');
    res.fd.should.exist;
    await fs.exists(res.path).should.eventually.be.ok;
  });

  it('should be able to create a temp file with tempDirectory', async function () {
    const preDirPath = await tempDir.staticDir();

    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'}, preDirPath);
    res.should.exist;
    res.path.should.exist;
    res.path.should.equal(nodePath.join(preDirPath, 'my-test-file.zip'));
    res.fd.should.exist;
    await fs.exists(res.path).should.eventually.be.ok;
  });

  it('should generate a random temp dir', async function () {
    let res = await tempDir.openDir();
    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    let res2 = await tempDir.openDir();
    await fs.exists(res2).should.eventually.be.ok;
    res.should.not.equal(res2);
  });

  it('should generate one temp dir used for the life of the process', async function () {
    let res = await tempDir.staticDir();
    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    let res2 = await tempDir.staticDir();
    await fs.exists(res2).should.eventually.be.ok;
    res.should.equal(res2);
  });

  it('should generate one temp dir used for the life of the process with tempDirectory', async function () {
    const preDirPath = await tempDir.staticDir();

    let res = await tempDir.staticDir(preDirPath);
    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    let res2 = await tempDir.staticDir(preDirPath);
    await fs.exists(res2).should.eventually.be.ok;
    res.should.equal(res2);
    res.should.equal(preDirPath);
    res2.should.equal(preDirPath);
  });
});
