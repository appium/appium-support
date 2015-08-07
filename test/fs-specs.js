"use strict";

import { fs } from '..';
import chai from 'chai';
import path from 'path';

let should = chai.should();

describe('fs', function () {
  it("should exist", function () {
    should.exist(fs);
  });
  it("should have expected methods", function () {
    should.exist(fs.open);
    should.exist(fs.close);
    should.exist(fs.access);
    should.exist(fs.mkdir);
    should.exist(fs.readlink);
    should.exist(fs.exists);
    should.exist(fs.rimraf);
    should.exist(fs.readFile);
    should.exist(fs.writeFile);
   });

   it('hasAccess', async () => {
    let existingPath = path.resolve(__dirname, 'fs-specs.js');
    (await fs.exists(existingPath)).should.be.ok;
    let nonExistingPath = path.resolve(__dirname, 'wrong-specs.js');
    (await fs.hasAccess(nonExistingPath)).should.not.be.ok;
  });
  it('exists', async () => {
    let existingPath = path.resolve(__dirname, 'fs-specs.js');
    (await fs.exists(existingPath)).should.be.ok;
    let nonExistingPath = path.resolve(__dirname, 'wrong-specs.js');
    (await fs.exists(nonExistingPath)).should.not.be.ok;
  });
  it('readFile', async () => {
    let existingPath = path.resolve(__dirname, 'fs-specs.js');
    (await fs.readFile(existingPath, 'utf8')).should.contain('readFile');
  });
  it('copyFile', async () => {
    let existingPath = path.resolve(__dirname, 'fs-specs.js');
    let newPath = path.resolve('/tmp', 'fs-specs.js');
    await fs.copyFile(existingPath, newPath);
    (await fs.readFile(newPath, 'utf8')).should.contain('readFile');
  });
  it('rimraf', async () => {
    let newPath = path.resolve('/tmp', 'fs-specs.js');
    (await fs.exists(newPath)).should.be.true;
    await fs.rimraf(newPath);
    (await fs.exists(newPath)).should.be.false;
  });
  it('md5', async () => {
    let existingPath = path.resolve(__dirname, 'fs-specs.js');
    (await fs.md5(existingPath)).should.have.length(32);
  });
  it('stat', async () => {
    let existingPath = path.resolve(__dirname, 'fs-specs.js');
    let stat = await fs.stat(existingPath);
    stat.should.have.property('atime');
  });
});

