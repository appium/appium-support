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
});
