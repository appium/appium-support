import * as tempDir from './lib/tempdir';
import * as system from './lib/system';
import * as util from './lib/util'; // eslint-disable-line import/no-duplicates
import { cancellableDelay } from './lib/util'; // eslint-disable-line import/no-duplicates
import fs from './lib/fs';
import * as net from './lib/net';
import * as plist from './lib/plist';
import { mkdirp } from './lib/mkdirp';
import * as logger from './lib/logging';
import * as process from './lib/process';
import * as zip from './lib/zip';
import * as imageUtil from './lib/image-util';

// can't add to other exports `as default`
// until JSHint figures out how to parse that pattern
export default { tempDir, system, util, fs, cancellableDelay, plist, mkdirp,
                 logger, process, zip, imageUtil, net };
