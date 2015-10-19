
import { util } from '..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import B from 'bluebird';
import sinon from 'sinon';

let should = chai.should();
chai.use(chaiAsPromised);

describe('util', function () {
  describe('hasValue', function () {
    it('should exist', function () {
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

  describe('hasContent', function () {
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

  describe('escapeSpace', function () {
    it('should do nothing to a string without space', function () {
      let actual = 'appium';
      let expected = 'appium';
      util.escapeSpace(actual).should.equal(expected);
    });

    it('should do escape spaces', function () {
      let actual = '/Applications/ Xcode 6.1.1.app/Contents/Developer';
      let expected = '/Applications/\\ Xcode\\ 6.1.1.app/Contents/Developer';
      util.escapeSpace(actual).should.equal(expected);
    });

    it('should escape consecutive spaces', function () {
      let actual = 'appium   space';
      let expected = 'appium\\ \\ \\ space';
      util.escapeSpace(actual).should.equal(expected);
    });
  });

  describe('localIp', function () {
    it('should find a local ip address', function () {
      let utilMock = sinon.mock(util);
      utilMock.expects('localIp').returns('10.35.4.175');
      util.localIp();
      utilMock.verify();
    });
  });

  describe('cancellableDelay', function () {
    it('should delay', async function () {
      await util.cancellableDelay('10');
    });
    it('cancel should work', async function () {
      let delay = util.cancellableDelay('1000');
      B.delay(10).then(function() { delay.cancel(); }).done();
      await delay.should.be.rejectedWith(/cancellation error/);
    });
  });

  describe('safeJsonParse', () => {
    it('should pass object through', () => {
      let obj = {a: 'a', b: 'b'};
      util.safeJsonParse(obj).should.equal(obj);
    });
    it('should correctly parse json string', () => {
      let obj = {a: 'a', b: 'b'};
      util.safeJsonParse(JSON.stringify(obj)).should.eql(obj);
    });
    it('should pass a number through', () => {
      let num = 42;
      util.safeJsonParse(num).should.eql(num);
    });
    it('should make a number from a string representation', () => {
      let num = 42;
      util.safeJsonParse(String(num)).should.eql(num);
    });
  });
});
