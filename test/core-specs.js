"use strict";

var core = require('..').core,
    chai = require('chai');

chai.should();

describe('core', function () {
  it('should exec and get stdout', function (done) {
    core.exec('echo hello').then(function (result) {
      result.should.be.instanceof(Array);
      result[0].should.equal('hello\n');
      done();
    }).catch(done);
  });

  it('should exec and get stderr', function (done) {
    core.exec('>&2 echo "error"').then(function (result) {
      result.should.be.instanceof(Array);
      result[1].should.equal('error\n');
      done();
    }).catch(done);
  });

  it('should reject with an error if exec fails', function (done) {
    core.exec('not_a_command').then(function () {
      done(new Error('promise resolved, but should not have'));
    }, function (reason) {
      reason.should.be.instanceof(Error);
      done();
    });
  });
});
