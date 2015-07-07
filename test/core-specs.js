"use strict";

import * as core from '../lib/core';
import chai from 'chai';
import { getLogger } from 'appium-logger';
const logger = getLogger('Appium-Support');
chai.should();


describe('core', function () {
  it('should exec and get stdout', async function () {
    try {
      let result = await core.exec('echo hello');
      result.should.be.instanceof(Array);
      result[0].should.equal('hello\n');
    } catch (err) {
      logger.errorAndThrow(err);
    }
  });

  it('should exec and get stderr', async function () {
    try {
      let result = await core.exec('>&2 echo "error"');
      result.should.be.instanceof(Array);
      result[1].should.equal('error\n');
    } catch (err) { 
      logger.errorAndThrow(err);
    }
  });

  it('should reject with an error if exec fails', async function () {
    let error;
    try{
      await core.exec('not_a_command'); 
    } catch (err) {
      error = err;
    }
    error.should.be.instanceof(Error);
  });
});
