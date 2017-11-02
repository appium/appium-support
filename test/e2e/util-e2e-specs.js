
import { util } from '../..';
import logger from '../../lib/logger';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
chai.use(chaiAsPromised);

describe('util', function () {
  describe('truncate', () => {
    it('should not leak memory when concatenating 300 strings that are 30 mb each (but truncated to 1 character)', () => {
      let s = [];
      for (let i=0; i<1000; i++) {
        logger.debug(`Adding 3mb string to string and concatenating to other string, truncated to 1 (expected string size ${i} mb)`);
        let hugeString = Array(30000000).join('a');
        s.push(`${util.truncate(hugeString, {length: 1000})}`);
      }
    });
  });
});
