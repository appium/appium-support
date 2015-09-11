
import { system } from '../index.js';
import chai from 'chai';
import os from 'os';
import sinon from 'sinon';
import * as teen_process from 'teen_process';
import _ from 'lodash';

chai.should();

let sandbox = null;
let SANDBOX = Symbol();
let mocks = {};
let libs = {teen_process, os, system};

describe('system', function () {
  describe('isX functions', function () {
    it('should correctly return Windows System if it is a Windows', function () {
      let osMock = sinon.mock(os);
      osMock.expects('type').returns('Windows_NT');
      system.isWindows().should.equal.true;
      osMock.verify();
      osMock.restore();
    });

    it('should correctly return Mac if it is a Mac', function () {
      let osMock = sinon.mock(os);
      osMock.expects('type').returns('Darwin');
      system.isMac().should.equal.true;
      osMock.verify();
      osMock.restore();
    });

    it('should correctly return Linux if it is a Linux', function () {
      let osMock = sinon.mock(os);
      osMock.expects('type').twice().returns('Linux');
      system.isLinux().should.equal.true;
      osMock.verify();
      osMock.restore();
    });
  });

  describe('architecture', function () {
    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      mocks[SANDBOX] = sandbox;
      for (let [key, value] of _.pairs(libs)) {
        mocks[key] = sandbox.mock(value);
      }
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should return correct architecture if it is a 64 bit Mac/Linux', async function() {
      mocks.os.expects('type').thrice().returns('Darwin');
      mocks.teen_process.expects('exec').once().withExactArgs('uname', ['-m']).returns({stdout: 'x86_64'});
      let arch = await system.arch();
      arch.should.equal('64');
      mocks[SANDBOX].verify();
    });

    it('should return correct architecture if it is a 32 bit Mac/Linux', async function() {
      mocks.os.expects('type').twice().returns('Linux');
      mocks.teen_process.expects('exec').once().withExactArgs('uname', ['-m']).returns({stdout: 'i686'});
      let arch = await system.arch();
      arch.should.equal('32');
      mocks[SANDBOX].verify();
    });

    it('should return correct architecture if it is a 64 bit Windows', async function() {
      mocks.os.expects('type').thrice().returns('Windows_NT');
      mocks.system.expects('isOSWin64').once().returns(true);
      let arch = await system.arch();
      arch.should.equal('64');
      mocks[SANDBOX].verify();
    });

    it('should return correct architecture if it is a 32 bit Windows', async function() {
      mocks.os.expects('type').thrice().returns('Windows_NT');
      mocks.system.expects('isOSWin64').once().returns(false);
      let arch = await system.arch();
      arch.should.equal('32');
      mocks[SANDBOX].verify();
    });
  });

  it('should know architecture', () => {
    return system.arch();
  });
});
