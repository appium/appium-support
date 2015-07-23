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
});

