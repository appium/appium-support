'use strict';
import * as system from '../lib/system';
import chai from 'chai';

let should = chai.should();

describe('system', function () {
  it('should exist', function () {
    should.exist(system.isWindows);
    should.exist(system.isLinux);
    should.exist(system.isMac);
  });
  if (system.isLinux || system.isMac) {
    it('should know architecture', async function () {
      let arch = await system.arch();
      ["32", "64"].should.contain(arch);
    });
  }
});
