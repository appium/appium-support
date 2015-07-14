"use strict";

var system = require('..').system,
    chai = require('chai');

var should = chai.should();

describe('system', function () {
  it('should exist', function () {
    should.exist(system.isWindows);
    should.exist(system.isLinux);
    should.exist(system.isMac);
  });
  it('should know architecture', function (done) {
    system.arch(function (err, arch) {
      should.not.exist(err);
      ["32", "64"].should.contain(arch);
      done();
    });
  });
});
