
import { tokenizePaths } from '../lib/native-path';
import chai from 'chai';

chai.should();

describe.only('NativePath', function () {
  describe('.tokenizePaths', function () {
    it('should parse direct children', function () {
      const node = tokenizePaths('/some.class.name')[0];
      node.className.should.equal('some.class.name');
      node.isDirectChild.should.be.true;
    });
    it('should parse global children', function () {
      const node = tokenizePaths('//some.class.name')[0];
      node.className.should.equal('some.class.name');
      node.isDirectChild.should.be.false;
    });
    it('should parse direct children', function () {
      const node = tokenizePaths('some.class.name')[0];
      node.className.should.equal('some.class.name');
      node.isDirectChild.should.be.true;
    });
  });
});
