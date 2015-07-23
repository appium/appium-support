"use strict";

import { rimraf } from '..';
import chai from 'chai';

let should = chai.should();

describe('rimraf', function () {
  it("should exist", function () {
    should.exist(rimraf);
  });
});

