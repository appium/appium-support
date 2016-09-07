
import { util } from '..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import B from 'bluebird';
import sinon from 'sinon';
import os from 'os';


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
      let ifConfigOut = {
        lo0:
         [ { address: '::1',
             netmask: 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
             family: 'IPv6',
             mac: '00:00:00:00:00:00',
             scopeid: 0,
             internal: true },
           { address: '127.0.0.1',
             netmask: '255.0.0.0',
             family: 'IPv4',
             mac: '00:00:00:00:00:00',
             internal: true },
           { address: 'fe80::1',
             netmask: 'ffff:ffff:ffff:ffff::',
             family: 'IPv6',
             mac: '00:00:00:00:00:00',
             scopeid: 1,
             internal: true } ],
        en0:
         [ { address: 'xxx',
             netmask: 'ffff:ffff:ffff:ffff::',
             family: 'IPv6',
             mac: 'd0:e1:40:93:56:9a',
             scopeid: 4,
             internal: false },
           { address: '123.123.123.123',
             netmask: '255.255.254.0',
             family: 'IPv4',
             mac: 'xxx',
             internal: false } ],
        awdl0:
         [ { address: 'xxx',
             netmask: 'ffff:ffff:ffff:ffff::',
             family: 'IPv6',
             mac: 'xxx',
             scopeid: 7,
             internal: false } ]
      };
      let osMock = sinon.mock(os);
      osMock.expects('networkInterfaces').returns(ifConfigOut);
      ifConfigOut = '';
      let ip = util.localIp();
      ip.should.eql('123.123.123.123');
      osMock.verify();
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

  describe('unwrapElement', () => {
    it('should pass through an unwrapped element', () => {
      let el = 4;
      util.unwrapElement(el).should.equal(el);
    });
    it('should pass through an element that is an object', () => {
      let el = {RANDOM: 4};
      util.unwrapElement(el).should.equal(el);
    });
    it('should unwrap a wrapped element', () => {
      let el = {ELEMENT: 4};
      util.unwrapElement(el).should.eql(4);
    });
  });
});
