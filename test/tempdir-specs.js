"use strict";

import * as tempDir from '../lib/tempdir';
import fs from 'fs';
import chai from 'chai';

chai.should();

describe('tempdir', function () {
  it('should be able to generate a path', function () {
    let path = tempDir.path({prefix: 'myfile', suffix: '.tmp'});
    path.should.exists;
    path.should.include('myfile.tmp');
  });

  it('should be able to create a temp file', async function () {
    let res = await tempDir.open({prefix: 'my-test-file', suffix: '.zip'});
    res.should.exist;
    res.path.should.exist;
    res.path.should.include('my-test-file.zip');
    res.fd.should.exist;
    fs.existsSync(res.path).should.be.ok;
  });
});

