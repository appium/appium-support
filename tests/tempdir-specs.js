var tempdir = require('..').tempDir,
    fs = require('fs'),
    chai = require('chai');

chai.should();

describe('tempdir', function () {
  it('should be able to create a temp file', function() {
    return tempdir
      .open({prefix: 'my-test-file', suffix: '.zip'})
      .then(function(res) {
        res.should.exist;
        res.path.should.exist;
        res.fd.should.exist;
        fs.existsSync(res.path).should.be.ok;
      });
  });
});
