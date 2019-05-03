
import { tempDir, fs } from '../index.js';
import chai from 'chai';
import nodePath from 'path';

chai.should();

describe('tempdir', function () {
  afterEach(function () {
    // set the process env as undefiend
    delete process.env.APPIUM_TEMP_DIR;
  });

  it('should be able to generate a path', async function () {
    const path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'});
    path.should.exist;
    path.should.include('myfile.tmp');
  });

  it('should be able to generate a path with tempDirectory', async function () {
    const preRootDirPath = await tempDir.openDir();

    const path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'}, undefined, preRootDirPath);
    path.should.exist;
    path.should.include(preRootDirPath);
    path.should.include('myfile.tmp');
  });

  it('should be able to generate a path with process.env.APPIUM_TEMP_DIR', async function () {
    const preRootDirPath = await tempDir.openDir();
    process.env.APPIUM_TEMP_DIR = preRootDirPath;

    const path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'});
    path.should.exist;
    path.should.include(preRootDirPath);
    path.should.include('myfile.tmp');
  });

  it('should be able to generate a path with ignoring process.env.APPIUM_TEMP_DIR', async function () {
    const preDirPath = await tempDir.openDir();
    process.env.APPIUM_TEMP_DIR = preDirPath;

    const path = await tempDir.path({prefix: 'myfile', suffix: '.tmp'}, undefined, null);
    path.should.exist;
    path.should.not.equal(nodePath.join(preDirPath, 'myfile.tmp'));
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
    const preRootDirPath = await tempDir.openDir();

    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'}, preRootDirPath);
    res.should.exist;
    res.path.should.exist;
    res.path.should.include(preRootDirPath);
    res.path.should.include('my-test-file.zip');
    res.fd.should.exist;
    await fs.exists(res.path).should.eventually.be.ok;
  });

  it('should be able to create a temp file with process.env.APPIUM_TEMP_DIR', async function () {
    const preRootDirPath = await tempDir.openDir();
    process.env.APPIUM_TEMP_DIR = preRootDirPath;

    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'});
    res.should.exist;
    res.path.should.exist;
    res.path.should.include(preRootDirPath);
    res.path.should.include('my-test-file.zip');
    res.fd.should.exist;
    await fs.exists(res.path).should.eventually.be.ok;
  });

  it('should be able to create a temp file with ignoring process.env.APPIUM_TEMP_DIR', async function () {
    const preDirPath = await tempDir.openDir();
    process.env.APPIUM_TEMP_DIR = preDirPath;

    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'}, null);
    res.should.exist;
    res.path.should.exist;
    res.path.should.not.equal(nodePath.join(preDirPath, 'my-test-file.zip'));
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

  it('should generate a random temp dir, but the same with process.env.APPIUM_TEMP_DIR', async function () {
    const preRootDirPath = await tempDir.openDir();
    process.env.APPIUM_TEMP_DIR = preRootDirPath;

    const res = await tempDir.openDir();
    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    const res2 = await tempDir.openDir();
    await fs.exists(res2).should.eventually.be.ok;
    res.should.include(preRootDirPath);
    res2.should.include(preRootDirPath);
    res.should.not.equal(res2);
  });

  it('should generate a random temp dir with ignoring process.env.APPIUM_TEMP_DIR', async function () {
    let res = await tempDir.openDir();
    process.env.APPIUM_TEMP_DIR = res;

    res.should.be.a('string');
    await fs.exists(res).should.eventually.be.ok;
    let res2 = await tempDir.openDir(null); // or undefined
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
});
