import _ from 'lodash';
import chai from 'chai';
import sinon from 'sinon';
import { timing } from '..';


chai.should();
const expect = chai.expect;

describe.only('timing', function () { // eslint-disable-line
  let processMock;
  afterEach(function () {
    processMock.verify();
  });

  describe('no bigint', function () {
    const bigintFn = process.hrtime.bigint;
    before(function () {
      // if the system has BigInt support, remove it
      if (_.isFunction(bigintFn)) {
        delete process.hrtime.bigint;
      }
    });
    beforeEach(function () {
      processMock = sinon.mock(process);
    });
    after(function () {
      if (_.isFunction(bigintFn)) {
        process.hrtime.bigint = bigintFn;
      }
    });
    it('should get a start time as array', function () {
      const startTime = timing.getStartTime();
      _.isArray(startTime).should.be.true;
    });
    it('should get a duration', function () {
      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime);
      _.isNumber(duration).should.be.true;
    });
    it('should get correct s', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_SECONDS,
        round: false,
      });
      duration.should.eql(13.000054321);
    });
    it('should get correct s rounded', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_SECONDS,
      });
      duration.should.eql(13);
    });
    it('should get correct ms', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_MILLIS,
        round: false,
      });
      duration.should.eql(13000.054321);
    });
    it('should get correct ns', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_NANOS,
        round: false,
      });
      duration.should.eql(13000054321);
    });
    it('should error if passing in a number', function () {
      expect(() => timing.getDuration(12345))
        .to.throw('Unable to get duration');
    });
    it('should error if passing in wrong unit', function () {
      const startTime = timing.getStartTime();
      expect(() => timing.getDuration(startTime, 'ds'))
        .to.throw('Unknown unit for duration');
    });
  });
  describe('bigint', function () {
    beforeEach(function () {
      processMock = sinon.mock(process.hrtime);
    });
    it('should get a start time as number', function () {
      // the non-mocked test cannot run if the function doesn't exist
      if (!_.isFunction(process.hrtime.bigint)) {
        return this.skip();
      }

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime);
      _.isNumber(duration).should.be.true;
    });
    it('should get correct s', function () {
      processMock.expects('bigint').twice()
        .onFirstCall().returns(BigInt(1172941153404030))
        .onSecondCall().returns(BigInt(1172951164887132));

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_SECONDS,
        round: false,
      });
      duration.should.be.eql(10.011483102);
    });
    it('should get correct s rounded', function () {
      processMock.expects('bigint').twice()
        .onFirstCall().returns(BigInt(1172941153404030))
        .onSecondCall().returns(BigInt(1172951164887132));

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_SECONDS,
      });
      duration.should.be.eql(10);
    });
    it('should get correct ms', function () {
      processMock.expects('bigint').twice()
        .onFirstCall().returns(BigInt(1172941153404030))
        .onSecondCall().returns(BigInt(1172951164887132));

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_MILLIS,
        round: false,
      });
      duration.should.be.eql(10011.483102);
    });
    it('should get correct ns', function () {
      processMock.expects('bigint').twice()
        .onFirstCall().returns(BigInt(1172941153404030))
        .onSecondCall().returns(BigInt(1172951164887132));

      const startTime = timing.getStartTime();
      const duration = timing.getDuration(startTime, {
        units: timing.DURATION_NANOS,
        round: false,
      });
      duration.should.be.eql(10011483102);
    });
    it('should error if passing in a non-bigint', function () {
      expect(() => timing.getDuration(12345))
        .to.throw('Unable to get duration');
    });
    it('should error if passing in wrong unit', function () {
      const startTime = timing.getStartTime();
      expect(() => timing.getDuration(startTime, 'ds'))
        .to.throw('Unknown unit for duration');
    });
  });
});
