"use strict";

var tempDir = require('..').tempDir,
    fs = require('fs'),
    chai = require('chai');

chai.should();

describe('tempdir', function () {
  it('should be able to generate a path', function () {
    var path = tempDir.path({prefix: 'myfile', suffix: '.tmp'});
    path.should.exists;
    path.should.include('myfile.tmp');
  });

  it('should be able to create a temp file', function () {
    return tempDir
      .open({prefix: 'my-test-file', suffix: '.zip'})
      .then(function (res) {
        res.should.exist;
        res.path.should.exist;
        res.path.should.include('my-test-file.zip');
        res.fd.should.exist;
        fs.existsSync(res.path).should.be.ok;
      });
  });
});
