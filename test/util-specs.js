"use strict";

var util = require('..').util
  , rimraf = require('rimraf')
  , path = require('path')
  , chaiAsPromised = require('chai-as-promised')
  , chai = require('chai');

chai.use(chaiAsPromised);
var should = chai.should();

describe('util', function () {
  var nan = NaN
    , none = null
    , f = function () {
    }
    , o = {}
    , n = 0
    , s = "string"
    , b = false
    , e = "";

  describe("hasValue ", function () {
    it("should work as expected", function () {
      should.exist(util.hasValue);

      util.hasValue(undefined).should.be.false;
      util.hasValue(nan).should.be.false;
      util.hasValue(none).should.be.false;
      util.hasValue(f).should.be.true;
      util.hasValue(o).should.be.true;
      util.hasValue(n).should.be.true;
      util.hasValue(s).should.be.true;
      util.hasValue(b).should.be.true;
    });
  });

  describe("hasContent ", function () {
    it("should work as expected", function () {
      should.exist(util.hasContent);

      util.hasContent(undefined).should.be.false;
      util.hasContent(nan).should.be.false;
      util.hasContent(none).should.be.false;
      util.hasContent(f).should.be.false;
      util.hasContent(o).should.be.false;
      util.hasContent(n).should.be.false;
      util.hasContent(s).should.be.true;
      util.hasContent(b).should.be.false;
      util.hasContent(e).should.be.false;
    });
  });

  describe("escapeSpace", function () {
    it("should do nothign to a string without space", function () {
      var actual = 'appium';
      var expected = 'appium';
      util.escapeSpace(actual).should.equal(expected);
    });

    it("should do escape spaces", function () {
      var actual = '/Applications/ Xcode 6.1.1.app/Contents/Developer';
      var expected = '/Applications/\\ Xcode\\ 6.1.1.app/Contents/Developer';
      util.escapeSpace(actual).should.equal(expected);
    });

    it("should escape consecutive spaces", function () {
      var actual = 'appium   space';
      var expected = 'appium\\ \\ \\ space';
      util.escapeSpace(actual).should.equal(expected);
    });
  });

  describe("fileExists", function () {
    it("should return true if file is readable", function () {
      return util
        .fileExists('/')
        .then(function (bool) {
          bool.should.be.true;
        });
    });

    it("should return false if file does not exist", function () {
      return util
        .fileExists('chuckwudi')
        .then(function (bool) {
          bool.should.be.false;
        });
    });
  });

  describe("localIp", function () {
    it("should find a local ip address", function () {
      var ip = util.localIp();
      ip.should.match(/\d*\.\d*\.\d*\.\d*/);
    });
  });

  describe("mkdirp", function () {
    var dirName = path.resolve(__dirname, "tmp");
    it("should make a directory that doesn't exist", function (done) {
      rimraf(dirName, function (err) {
        if (err) return done(err);
        util.mkdirp(dirName).then(function () {
          util.fileExists(dirName).then(function (exists) {
            exists.should.be.true;
            done();
          }).catch(done);
        }).catch(done);
      });
    });

    it("should not complain if the dir already exists", function (done) {
      util.fileExists(dirName).then(function (exists) {
        exists.should.be.true;
        util.mkdirp(dirName).then(done).catch(done);
      }).catch(done);
    });

    it("should still throw an error if something else goes wrong", function (done) {
      util.mkdirp("/bin/foo").should.eventually.be.rejectedWith('EACCES')
                             .then(done).catch(done);
    });
  });
});
