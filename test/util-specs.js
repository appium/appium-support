"use strict";

import * as util from '../lib/util';
import _rimraf from 'rimraf';
import path from 'path';
import chai from 'chai';
import B from 'bluebird';
import sinon from 'sinon';

let rimraf = B.promisify(_rimraf);
let should = chai.should();


describe('util', function () {

  describe("hasValue ", function () {
    it("should exist", function () {
      should.exist(util.hasValue);
    });

    it('should handle undefined', function () {
      util.hasValue(undefined).should.be.false;
    });

    it('should handle not a number', function () { 
      util.hasValue(NaN).should.be.false;
    });

    it('should handle null', function () {
      util.hasValue(null).should.be.false;
    });

    it('should handle functions', function () {
      util.hasValue(function () {}).should.be.true;
    });

    it('should handle empty arrays', function () {
      util.hasValue({}).should.be.true;
    });

    it('should handle zero', function () {
      util.hasValue(0).should.be.true;
    });

    it('should handle simple string', function () {
      util.hasValue('string').should.be.true;
    });

    it('should handle booleans', function () {
      util.hasValue(false).should.be.true;
    });

    it('should handle empty strings', function () {
      util.hasValue('').should.be.true;
    });
  });

  describe("hasContent ", function () {
    it('should exist', function () {
      should.exist(util.hasContent);
    });

    it('should handle undefined', function () {
      util.hasContent(undefined).should.be.false;
    });

    it('should handle not a number', function () {
      util.hasContent(NaN).should.be.false;
    });

    it('should handle null', function () {
      util.hasContent(null).should.be.false;
    });

    it('should handle functions', function () {
      util.hasContent(function () {}).should.be.false;
    });

    it('should handle empty arrays', function () {
      util.hasContent({}).should.be.false;
    });

    it('should handle zero', function () {
      util.hasContent(0).should.be.false;
    });

    it('should handle simple string', function () {
      util.hasContent('string').should.be.true;
    });

    it('should handle booleans', function () {
      util.hasContent(false).should.be.false;
    });

    it('should handle empty strings', function () {
      util.hasContent('').should.be.false;
    });
  });

  describe("escapeSpace", function () {
    it("should do nothing to a string without space", function () {
      let actual = 'appium';
      let expected = 'appium';
      util.escapeSpace(actual).should.equal(expected);
    });

    it("should do escape spaces", function () {
      let actual = '/Applications/ Xcode 6.1.1.app/Contents/Developer';
      let expected = '/Applications/\\ Xcode\\ 6.1.1.app/Contents/Developer';
      util.escapeSpace(actual).should.equal(expected);
    });

    it("should escape consecutive spaces", function () {
      let actual = 'appium   space';
      let expected = 'appium\\ \\ \\ space';
      util.escapeSpace(actual).should.equal(expected);
    });
  });

  describe("fileExists", function () {
    it("should return true if file is readable", async function () {
      let exists = await util.hasAccess('/');
      exists.should.be.true;
      
    });

    it("should return false if file does not exist", async function () {
      let exists = await util.hasAccess('chuckwudi');
      exists.should.be.false;
    });
  });

  describe("localIp", function () {
    it("should find a local ip address", function () {
      let utilMock = sinon.mock(util);
      utilMock.expects('localIp').returns('10.35.4.175');
      util.localIp();
      utilMock.verify();
    });
  });

  describe("mkdir", function () {
    let dirName = path.resolve(__dirname, "tmp");
    
    it("should make a directory that doesn't exist", async function () {
      await rimraf(dirName); 
      await util.mkdir(dirName);
      let exists = await util.hasAccess(dirName);
      exists.should.be.true;   
    });
    
    it("should not complain if the dir already exists", async function () {
        let exists = await util.hasAccess(dirName);
        exists.should.be.true;
        await util.mkdir(dirName);
    });

    it("should still throw an error if something else goes wrong", async function () {
      await util.mkdir("/bin/foo").should.be.rejected;                
    });
  });
});

