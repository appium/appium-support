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

  it('parse paths properly', function () {
    var parts = system.posixParsePath('/home/user/dir/file.txt');
    parts.root.should.equal("/");
    parts.dir.should.equal("/home/user/dir");
    parts.base.should.equal("file.txt");
    parts.ext.should.equal(".txt");
    parts.name.should.equal("file");

    parts = system.win32ParsePath('C:\\path\\dir\\index.html');
    parts.root.should.equal("C:\\");
    parts.dir.should.equal("C:\\path\\dir");
    parts.base.should.equal("index.html");
    parts.ext.should.equal(".html");
    parts.name.should.equal("index");
  })
});
