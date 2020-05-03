import _ from 'lodash';
import fs from './fs';
import url from 'url';
import B from 'bluebird';
import { toReadableSizeString } from './util';
import log from './logger';
import Ftp from 'jsftp';
import Timer from './timing';
import axios from 'axios';
import request from 'request-promise';


function toAxiosAuth (auth) {
  if (!_.isPlainObject(auth)) {
    return null;
  }

  const axiosAuth = {
    username: auth.username || auth.user,
    password: auth.password || auth.pass,
  };
  return (axiosAuth.username && axiosAuth.password) ? axiosAuth : null;
}


async function uploadFileToHttp (remoteUrl, uploadOptions = {}) {
  log.debug(`${remoteUrl.protocol} upload options: ${JSON.stringify(uploadOptions)}`);
  const response = await request(uploadOptions);
  const responseDebugMsg = `Response code: ${response.statusCode}. ` +
                           `Response body: ${JSON.stringify(response.body)}`;
  log.debug(responseDebugMsg);
  if (response.statusCode >= 400) {
    throw new Error(`Cannot upload the file to '${remoteUrl.href}'. ${responseDebugMsg}`);
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
  if (!await fs.exists(localPath)) {
    throw new Error (`'${localPath}' does not exists or is not accessible`);
  }
  const remoteUrl = url.parse(remotePath);
  const {size} = await fs.stat(localPath);
  log.info(`Uploading '${localPath}' of ${toReadableSizeString(size)} size to '${remotePath}'...`);
  const timer = new Timer().start();
  if (['http:', 'https:'].includes(remoteUrl.protocol)) {
    await uploadFileToHttp(remoteUrl, uploadOptions);
  } else if (remoteUrl.protocol === 'ftp:') {
    await uploadFileToFtp(fs.createReadStream(localPath), remoteUrl, uploadOptions);
  } else {
    throw new Error(`Cannot upload the file at '${localPath}' to '${remotePath}'. ` +
                    `Unsupported remote protocol '${remoteUrl.protocol}'. ` +
                    `Only http/https and ftp protocols are supported.`);
  }
  log.info(`Uploaded '${localPath}' of ${toReadableSizeString(size)} size in ${timer.getDuration().asSeconds.toFixed(3)}s`);
}

/**
 * @typedef {Object} DownloadOptions
 * @property {boolean} isMetered [true] - Whether to log the actual download performance
 * (e.g. timings and speed)
 * @property {Object} auth - An object containing optional HTTP basic auth
 * credentials. Possible properties: `user`/`username` and `pass`/`password`
 * @property {number} timeout [5000] - The actual request timeout in milliseconds
 * @property {Object} headers - Request headers mapping
 */

/**
 * Downloads the given file via HTTP(S)
 *
 * @param {string} remoteUrl - The remote url
 * @param {string} dstPath - The local path to download the file to
 * @param {?DownloadOptions} downloadOptions
 * @throws {Error} If download operation fails
 */
async function downloadFile (remoteUrl, dstPath, downloadOptions = {}) {
  const {
    isMetered = true,
    auth,
    timeout = 5000,
    headers,
  } = downloadOptions;

  const requestOpts = {
    url: remoteUrl,
    responseType: 'stream',
    timeout,
  };
  const axiosAuth = toAxiosAuth(auth);
  if (axiosAuth) {
    requestOpts.auth = axiosAuth;
  }
  if (_.isPlainObject(headers)) {
    requestOpts.headers = headers;
  }

  const timer = new Timer().start();
  try {
    const writer = fs.createWriteStream(dstPath);
    const responseStream = (await axios(requestOpts)).data;
    responseStream.pipe(writer);

    await new B((resolve, reject) => {
      responseStream.once('error', reject);
      writer.once('finish', resolve);
      writer.once('error', (e) => {
        responseStream.unpipe(writer);
        reject(e);
      });
    });
  } catch (err) {
    throw new Error(`Cannot download the file from ${remoteUrl}: ${err.message}`);
  }
  if (!isMetered) {
    return;
  }

  const secondsElapsed = timer.getDuration().asSeconds;
  const {size} = await fs.stat(dstPath);
  log.debug(`${remoteUrl} (${toReadableSizeString(size)}) ` +
    `has been downloaded to '${dstPath}' in ${secondsElapsed.toFixed(3)}s`);
  if (secondsElapsed >= 2) {
    const bytesPerSec = Math.floor(size / secondsElapsed);
    log.debug(`Approximate download speed: ${toReadableSizeString(bytesPerSec)}/s`);
  }
}

export { uploadFile, downloadFile };
