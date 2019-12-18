import _ from 'lodash';
import chai from 'chai';
import sinon from 'sinon';
import { timing } from '..';


chai.should();
const expect = chai.expect;

describe('timing', function () {
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
      const timer = new timing.Timer().start();
      _.isArray(timer.startTime).should.be.true;
    });
    it('should get a duration', function () {
      const timer = new timing.Timer().start();
      const duration = timer.getDuration();
      _.isNumber(duration.duration).should.be.true;
      _.isString(duration.units).should.be.true;
    });
    it('should get correct s', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_SECONDS,
        round: false,
      });
      duration.duration.should.eql(13.000054321);
      duration.units.should.eql('s');
    });
    it('should get correct s rounded', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_SECONDS,
      });
      duration.duration.should.eql(13);
      duration.units.should.eql('s');
    });
    it('should get correct ms', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_MILLIS,
        round: false,
      });
      duration.duration.should.eql(13000.054321);
      duration.units.should.eql('ms');
    });
    it('should get correct ns', function () {
      processMock.expects('hrtime').twice()
        .onFirstCall().returns([12, 12345])
        .onSecondCall().returns([13, 54321]);

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_NANOS,
        round: false,
      });
      duration.duration.should.eql(13000054321);
      duration.units.should.eql('ns');
    });
    it('should error if the timer was not started', function () {
      const timer = new timing.Timer();
      expect(() => timer.getDuration())
        .to.throw('Unable to get duration');
    });
    it('should error if start time is a number', function () {
      const timer = new timing.Timer();
      timer._startTime = 12345;
      expect(() => timer.getDuration())
        .to.throw('Unable to get duration');
    });
    it('should error if passing in wrong unit', function () {
      const timer = new timing.Timer().start();
      expect(() => timer.getDuration('ds'))
        .to.throw('Unknown unit for duration');
    });
  });
  describe('bigint', function () {
    beforeEach(function () {
      // the non-mocked test cannot run if BigInt does not exist,
      // and it cannot be mocked. Luckily support was added in Node 10.4.0,
      // so it should not be a case where we are testing without this,
      // though it still can be a test that Appium is _used_ without it.
      if (!_.isFunction(process.hrtime.bigint)) {
        return this.skip();
      }
      processMock = sinon.mock(process.hrtime);
    });

    function setupMocks (once = false) {
      if (once) {
        processMock.expects('bigint').once()
          .onFirstCall().returns(BigInt(1172941153404030));
      } else {
        processMock.expects('bigint').twice()
          .onFirstCall().returns(BigInt(1172941153404030))
          .onSecondCall().returns(BigInt(1172951164887132));
      }
    }

    it('should get a duration', function () {
      setupMocks();

      const timer = new timing.Timer().start();
      const duration = timer.getDuration();
      _.isNumber(duration.duration).should.be.true;
    });
    it('should get correct s', function () {
      setupMocks();

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_SECONDS,
        round: false,
      });
      duration.duration.should.be.eql(10.011483102);
      duration.units.should.eql('s');
    });
    it('should get correct s rounded', function () {
      setupMocks();

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_SECONDS,
      });
      duration.duration.should.be.eql(10);
      duration.units.should.eql('s');
    });
    it('should get correct ms', function () {
      setupMocks();

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_MILLIS,
        round: false,
      });
      duration.duration.should.be.eql(10011.483102);
      duration.units.should.eql('ms');
    });
    it('should get correct ns', function () {
      setupMocks();

      const timer = new timing.Timer().start();
      const duration = timer.getDuration({
        units: timing.DURATION_NANOS,
        round: false,
      });
      duration.duration.should.be.eql(10011483102);
      duration.units.should.eql('ns');
    });
    it('should error if the timer was not started', function () {
      const timer = new timing.Timer();
      expect(() => timer.getDuration())
        .to.throw('Unable to get duration');
    });
    it('should error if passing in a non-bigint', function () {
      const timer = new timing.Timer();
      timer._startTime = 12345;
      expect(() => timer.getDuration())
        .to.throw('Unable to get duration');
    });
    it('should error if passing in wrong unit', function () {
      setupMocks(true);

      const timer = new timing.Timer().start();
      expect(() => timer.getDuration('ds'))
        .to.throw('Unknown unit for duration');
    });
  });
});
