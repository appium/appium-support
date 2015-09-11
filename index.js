import * as tempDir from './lib/tempdir';
import * as system from './lib/system';
import * as util from './lib/util';
import { cancellableDelay } from './lib/util';
import fs from './lib/fs';
import * as plist from './lib/plist';
import { mkdirp } from './lib/mkdirp';

// can't add to other exports `as default`
// until JSHint figures out how to parse that pattern
export default { tempDir, system, util, fs, cancellableDelay, plist, mkdirp };
