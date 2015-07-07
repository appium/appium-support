"use strict";

import * as util from '../lib/util';
import rimraf from 'rimraf';
import path from 'path';
import chaiAsPromised from 'chai-as-promised';
import chai from 'chai';
import { getLogger } from 'appium-logger';
import B from 'bluebird';

let promisifiedRimraf= B.promisify(rimraf);
const logger = getLogger('Appium-Support');
chai.use(chaiAsPromised);
let should = chai.should();

describe('util', function () {
  let nan = NaN
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
      let exists = await util.fileExists('/');
      exists.should.be.true;
      
    });

    it("should return false if file does not exist", async function () {
      let exists = await util.fileExists('chuckwudi');
      exists.should.be.false;
      
       
    });
  });

  describe("localIp", function () {
    it("should find a local ip address", function () {
      let ip = util.localIp();
      ip.should.match(/\d*\.\d*\.\d*\.\d*/);
    });
  });

  describe("mkdirp", function () {
    let dirName = path.resolve(__dirname, "tmp");
    
    it("should make a directory that doesn't exist", async function () {
      try { 
        promisifiedRimraf(dirName); 
      } catch (err) {
        logger.errorAndThrow(err); 
      }
      await util.mkdirp(dirName);
      try {
        let exists = await util.fileExists(dirName);
        exists.should.be.true;
      } catch (err) {
        logger.errorAndThrow(err);
      }
    });
    
    it("should not complain if the dir already exists", async function () {
      try {
        let exists = await util.fileExists(dirName);
        exists.should.be.true;
        await util.mkdirp(dirName);
      } catch (err) { 
        logger.errorAndThrow(err);
      }
    });

    it("should still throw an error if something else goes wrong", function () {
      util.mkdirp("/bin/foo").should.eventually.be.rejectedWith('EACCES');                 
    });
  });
});

