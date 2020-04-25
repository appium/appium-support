import chai from 'chai';
import { fs } from '../index';
import os from 'os';
import path from 'path';
import { SecureValuesPreprocessor } from '../lib/log-internal';


const CONFIG_PATH = path.resolve(os.tmpdir(), 'rules.json');


chai.should();


describe('Log Internals', function () {
  let preprocessor;

  beforeEach(function () {
    preprocessor = new SecureValuesPreprocessor();
  });

  it('should preprocess a string and make replacements', async function () {
    await fs.writeFile(CONFIG_PATH, JSON.stringify([
      'yolo',
    ]));
    const issues = await preprocessor.loadRules(CONFIG_PATH);
    issues.length.should.eql(0);
    preprocessor.rules.length.should.eql(1);
    const replacer = preprocessor.rules[0].replacer;
    preprocessor.preprocess('yolo yo yolo').should.eql(`${replacer} yo ${replacer}`);
  });

});
