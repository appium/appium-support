"use strict";

var util = require('..').util
  , chai = require('chai');

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
});
