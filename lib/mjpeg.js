import _ from 'lodash';
import request from 'request';
import log from './logger';
import http from 'http';
import B from 'bluebird';
import { getJimpImage, MIME_PNG } from './image-util';
import mJpegServer from 'mjpeg-server';
import { Writable } from 'stream';
import { requirePackage } from './node';


// lazy load this, as it might not be available
let MJpegConsumer = null;

/**
 * @throws {Error} If `mjpeg-consumer` module is not installed or cannot be loaded
 */
async function initMJpegConsumer () {
  if (!MJpegConsumer) {
    try {
      MJpegConsumer = await requirePackage('mjpeg-consumer');
    } catch (ign) {}
  }
  if (!MJpegConsumer) {
    throw new Error('mjpeg-consumer module is required to use MJPEG-over-HTTP features. ' +
                    'Please install it first (npm i -g mjpeg-consumer) and restart Appium.');
  }
}

const TEST_IMG_JPG = '/9j/4QAYRXhpZgAASUkqAAgAAAAAAAAAAAAAAP/sABFEdWNreQABAAQAAAAeAAD/4QOBaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wLwA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA1LjYtYzE0MCA3OS4xNjA0NTEsIDIwMTcvMDUvMDYtMDE6MDg6MjEgICAgICAgICI+IDxyZGY6UkRGIHhtbG5zOnJkZj0iaHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyI+IDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PSIiIHhtbG5zOnhtcE1NPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvbW0vIiB4bWxuczpzdFJlZj0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL3NUeXBlL1Jlc291cmNlUmVmIyIgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6NGY5ODc1OTctZGE2My00Y2M0LTkzNDMtNGYyNjgzMGUwNjk3IiB4bXBNTTpEb2N1bWVudElEPSJ4bXAuZGlkOjlDMzI3QkY0N0Q3NTExRThCMTlDOTVDMDc2RDE5MDY5IiB4bXBNTTpJbnN0YW5jZUlEPSJ4bXAuaWlkOjlDMzI3QkYzN0Q3NTExRThCMTlDOTVDMDc2RDE5MDY5IiB4bXA6Q3JlYXRvclRvb2w9IkFkb2JlIFBob3Rvc2hvcCBDQyAyMDE4IChNYWNpbnRvc2gpIj4gPHhtcE1NOkRlcml2ZWRGcm9tIHN0UmVmOmluc3RhbmNlSUQ9InhtcC5paWQ6NGY5ODc1OTctZGE2My00Y2M0LTkzNDMtNGYyNjgzMGUwNjk3IiBzdFJlZjpkb2N1bWVudElEPSJ4bXAuZGlkOjRmOTg3NTk3LWRhNjMtNGNjNC05MzQzLTRmMjY4MzBlMDY5NyIvPiA8L3JkZjpEZXNjcmlwdGlvbj4gPC9yZGY6UkRGPiA8L3g6eG1wbWV0YT4gPD94cGFja2V0IGVuZD0iciI/Pv/uAA5BZG9iZQBkwAAAAAH/2wCEABALCwsMCxAMDBAXDw0PFxsUEBAUGx8XFxcXFx8eFxoaGhoXHh4jJSclIx4vLzMzLy9AQEBAQEBAQEBAQEBAQEABEQ8PERMRFRISFRQRFBEUGhQWFhQaJhoaHBoaJjAjHh4eHiMwKy4nJycuKzU1MDA1NUBAP0BAQEBAQEBAQEBAQP/AABEIACAAIAMBIgACEQEDEQH/xABgAAEAAwEAAAAAAAAAAAAAAAAABAUHCAEBAAAAAAAAAAAAAAAAAAAAABAAAQMCAgsAAAAAAAAAAAAAAAECBBEDEgYhMRODo7PTVAUWNhEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8Az8AAdAAAAAAI8+fE8dEuTZtzZR7VMb6OdTE5GJoYirrUp/e8qd9wb3TGe/lJ2551sx8D/9k=';

// amount of time to wait for the first image in the stream
const MJPEG_SERVER_TIMEOUT_MS = 10000;

/** Class which stores the last bit of data streamed into it */
class MJpegStream extends Writable {

  /**
   * Create an MJpegStream
   * @param {string} mJpegUrl - URL of MJPEG-over-HTTP stream
   * @param {function} [errorHandler=noop] - additional function that will be
   * called in the case of any errors.
   * @param {object} [options={}] - Options to pass to the Writable constructor
   */
  constructor (mJpegUrl, errorHandler = _.noop, options = {}) {
    super(options);

    this.errorHandler = errorHandler;
    this.url = mJpegUrl;
    this.clear();
  }

  /**
   * Get the base64-encoded version of the JPEG
   * @returns {string}
   */
  get lastChunkBase64 () {
    return _.isBuffer(this.lastChunk) ?
      this.lastChunk.toString('base64') :
      null;
  }

  /**
   * Get the PNG version of the JPEG buffer
   * @returns {Buffer} PNG image data
   */
  async lastChunkPNG () {
    if (!_.isBuffer(this.lastChunk)) {
      return null;
    }

    const jpg = await getJimpImage(this.lastChunk);
    return await jpg.getBuffer(MIME_PNG);
  }

  /**
   * Get the base64-encoded version of the PNG
   * @returns {string}
   */
  async lastChunkPNGBase64 () {
    const png = await this.lastChunkPNG();

    if (!png) {
      return null;
    }

    return png.toString('base64');
  }

  /**
   * Reset internal state
   */
  clear () {
    this.registerStartSuccess = null;
    this.registerStartFailure = null;
    this.request = null;
    this.consumer = null;
    this.lastChunk = null;
    this.updateCount = 0;
  }

  /**
   * Start reading the MJpeg stream and storing the last image
   */
  async start (serverTimeout = MJPEG_SERVER_TIMEOUT_MS) {
    // ensure we're not started already
    this.stop();

    await initMJpegConsumer();

    this.consumer = new MJpegConsumer();

    // use the deferred pattern so we can wait for the start of the stream
    // based on what comes in from an external pipe
    const startPromise = new B((res, rej) => {
      this.registerStartSuccess = res;
      this.registerStartFailure = rej;
    })
    // start a timeout so that if the server does not return data, we don't
    // block forever.
      .timeout(serverTimeout,
        `Waited ${serverTimeout}ms but the MJPEG server never sent any images`);

    const onErr = (err) => {
      log.error(`Error getting MJpeg screenshot chunk: ${err}`);
      this.errorHandler(err);
      if (this.registerStartFailure) {
        this.registerStartFailure(err);
      }
    };

    this.request = request(this.url);

    this.request
      .on('error', onErr) // ensure we do something with errors
      .pipe(this.consumer) // allow chunking and transforming of jpeg data
      .pipe(this); // send the actual jpegs to ourself

    await startPromise;
  }

  /**
   * Stop reading the MJpeg stream. Ensure we disconnect all the pipes and stop
   * the HTTP request itself. Then reset the state.
   */
  stop () {
    if (!this.consumer) {
      return;
    }

    this.consumer.unpipe();
    this.request.end();
    this.clear();
  }

  /**
   * Override the Writable write() method in order to save the last image and
   * log the number of images we have received
   * @override
   * @param {Buffer} data - binary data streamed from the MJpeg consumer
   */
  write (data) {
    this.lastChunk = data;
    this.updateCount++;

    if (this.registerStartSuccess) {
      this.registerStartSuccess();
      this.registerStartSuccess = null;
    }
  }
}

/**
 * Start an mjpeg server for the purpose of testing, which just sends the same
 * image over and over. Caller is responsible for closing the server.
 * @param {int} port - port the server should listen on
 * @param {int} [intMs] - how often the server should push an image
 * @param {int} [times] - how many times the server should push an image before
 * it closes the connection
 * @returns {http.Server}
 */
function initMJpegServer (port, intMs = 300, times = 20) {
  const server = http.createServer(async function (req, res) {
    const mJpegReqHandler = mJpegServer.createReqHandler(req, res);
    const jpg = Buffer.from(TEST_IMG_JPG, 'base64');

    // just send the same jpeg over and over
    for (let i = 0; i < times; i++) {
      await B.delay(intMs);
      mJpegReqHandler._write(jpg, null, _.noop);
    }
    mJpegReqHandler.close();
  }).listen(port);

  return server;
}

export { MJpegStream, initMJpegServer, TEST_IMG_JPG };
