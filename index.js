

import * as tempDir from './lib/tempdir';
import * as system from './lib/system';
import * as util from './lib/util';

// can't add to other exports `as default`
// until JSHint figures out how to parse that pattern
export default {
  tempDir,
  system,
  util
};

export { tempDir, system, util };
