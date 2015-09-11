
import AppiumSupport from '../index.js';
import chai from 'chai';

chai.should();
let { system, tempDir, util } = AppiumSupport;

describe('index', () => {
  describe('default', () => {
    it('should expose an object', () => {
      AppiumSupport.should.exist;
      AppiumSupport.should.be.an.instanceof(Object);
    });
    it('should expose system object', () => {
      AppiumSupport.system.should.exist;
      AppiumSupport.system.should.be.an.instanceof(Object);
    });
    it('should expose tempDir object', () => {
      AppiumSupport.tempDir.should.exist;
      AppiumSupport.tempDir.should.be.an.instanceof(Object);
    });
    it('should expose util object', () => {
      AppiumSupport.util.should.exist;
      AppiumSupport.util.should.be.an.instanceof(Object);
    });
  });

  it('should expose an object as "system" ', () => {
    system.should.be.an.instanceof(Object);
  });

  it('should expose an object as "tempDir" ', () => {
    tempDir.should.be.an.instanceof(Object);
  });

  it('should expose an object as "util" ', () => {
    util.should.be.an.instanceof(Object);
  });
});
