
import { system } from '../index.js';
import chai from 'chai';
import os from 'os';
import sinon from 'sinon';
import * as teen_process from 'teen_process';
import _ from 'lodash';

chai.should();

let sandbox, tpMock, osMock = null;
let SANDBOX = Symbol();
let mocks = {};
let libs = {teen_process, os, system};

describe('system', () => {
  describe('isX functions', () => {
    beforeEach(() => {
      osMock = sinon.mock(os);
    });
    afterEach(() => {
      osMock.verify();
      osMock.restore();
    });

    it('should correctly return Windows System if it is a Windows', () => {
      osMock.expects('type').returns('Windows_NT');
      system.isWindows().should.equal.true;
    });

    it('should correctly return Mac if it is a Mac', () => {
      osMock.expects('type').returns('Darwin');
      system.isMac().should.equal.true;
    });

    it('should correctly return Linux if it is a Linux', () => {
      osMock.expects('type').twice().returns('Linux');
      system.isLinux().should.equal.true;
    });
  });

  describe('mac OSX version', () => {
    beforeEach(() => {
      tpMock = sinon.mock(teen_process);
    });
    afterEach(() => {
      tpMock.verify();
      tpMock.restore();
    });

    it('should return correct version for 10.10.5', async () => {
      tpMock.expects('exec').once().withExactArgs('sw_vers', ['-productVersion']).returns({stdout: '10.10.5'});
      await system.macOsxVersion().should.eventually.equal('10.10');
    });

    it('should return correct version for 10.12', async () => {
      tpMock.expects('exec').once().withExactArgs('sw_vers', ['-productVersion']).returns({stdout: '10.12.0'});
      await system.macOsxVersion().should.eventually.equal('10.12');
    });

    it('should return correct version for 10.12 with newline', async () => {
      tpMock.expects('exec').once().withExactArgs('sw_vers', ['-productVersion']).returns({stdout: '10.12   \n'});
      await system.macOsxVersion().should.eventually.equal('10.12');
    });

    it("should throw an error if OSX version can't be determined", async () => {
      let invalidOsx = '99.99.99';
      tpMock.expects('exec').once().withExactArgs('sw_vers', ['-productVersion']).returns({stdout: invalidOsx});
      await system.macOsxVersion().should.eventually.be.rejectedWith(invalidOsx);
    });
  });

  describe('architecture', () => {
    beforeEach(() => {
      sandbox = sinon.sandbox.create();
      mocks[SANDBOX] = sandbox;
      for (let [key, value] of _.toPairs(libs)) {
        mocks[key] = sandbox.mock(value);
      }
    });

    afterEach(() => {
      sandbox.restore();
    });

    it('should return correct architecture if it is a 64 bit Mac/Linux', async () => {
      mocks.os.expects('type').thrice().returns('Darwin');
      mocks.teen_process.expects('exec').once().withExactArgs('uname', ['-m']).returns({stdout: 'x86_64'});
      let arch = await system.arch();
      arch.should.equal('64');
      mocks[SANDBOX].verify();
    });

    it('should return correct architecture if it is a 32 bit Mac/Linux', async () => {
      mocks.os.expects('type').twice().returns('Linux');
      mocks.teen_process.expects('exec').once().withExactArgs('uname', ['-m']).returns({stdout: 'i686'});
      let arch = await system.arch();
      arch.should.equal('32');
      mocks[SANDBOX].verify();
    });

    it('should return correct architecture if it is a 64 bit Windows', async () => {
      mocks.os.expects('type').thrice().returns('Windows_NT');
      mocks.system.expects('isOSWin64').once().returns(true);
      let arch = await system.arch();
      arch.should.equal('64');
      mocks[SANDBOX].verify();
    });

    it('should return correct architecture if it is a 32 bit Windows', async () => {
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
