import { createReadStream } from 'fs';
import { stat, exists } from './fs';
import url from 'url';
import B from 'bluebird';
import { toReadableSizeString } from './util';
import log from './logger';
import request from 'request-promise';
import Ftp from 'jsftp';


async function uploadFileToHttp (remoteUrl, uploadOptions = {}) {
  log.debug(`${remoteUrl.protocol} upload options: ${JSON.stringify(uploadOptions)}`);
  const response = await request(uploadOptions);
  const responseDebugMsg = `Response code: ${response.statusCode}. ` +
                           `Response body: ${JSON.stringify(response.body)}`;
  log.debug(responseDebugMsg);
  if (response.statusCode >= 400) {
    throw new Error(`Cannot upload the recorded media to '${remoteUrl.href}'. ${responseDebugMsg}`);
  }
}

async function uploadFileToFtp (localFileStream, remoteUrl, uploadOptions = {}) {
  log.debug(`${remoteUrl.protocol} upload options: ${JSON.stringify(uploadOptions)}`);
  return await new B((resolve, reject) => {
    new Ftp(uploadOptions).put(localFileStream, remoteUrl.pathname, (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

/**
 * Uploads the given file to a remote location. HTTP(S) and FTP
 * protocols are supported.
 *
 * @param {string} localPath - The path to a file on the local storage.
 * @param {string} remotePath - The remote URL to upload the file to.
 * @param {Object} uploadOptions - The options set, which depends on the protocol set for remotePath.
 *                                 See https://www.npmjs.com/package/request-promise and
 *                                 https://www.npmjs.com/package/jsftp for more details.
 */
async function uploadFile (localPath, remotePath, uploadOptions = {}) {
  if (!await exists(localPath)) {
    throw new Error (`'${localPath}' does not exists or is not accessible`);
  }
  const remoteUrl = url.parse(remotePath);
  const {size} = await stat(localPath);
  log.info(`Uploading '${localPath}' of ${toReadableSizeString(size)} size to '${remotePath}'...`);
  const timeStarted = process.hrtime();
  if (['http:', 'https:'].includes(remoteUrl.protocol)) {
    await uploadFileToHttp(remoteUrl, uploadOptions);
  } else if (remoteUrl.protocol === 'ftp:') {
    await uploadFileToFtp(createReadStream(localPath), remoteUrl, uploadOptions);
  } else {
    throw new Error(`Cannot upload the file at '${localPath}' to '${remotePath}'. ` +
                    `Unsupported remote protocol '${remoteUrl.protocol}'. ` +
                    `Only http/https and ftp protocols are supported.`);
  }
  const timeElapsed = process.hrtime(timeStarted)[0];
  log.info(`Uploaded '${localPath}' of ${toReadableSizeString(size)} size in ${timeElapsed} second${timeElapsed === 1 ? '' : 's'}`);
}

export { uploadFile };
