import _ from 'lodash';
import { mjpeg } from '..';
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import B from 'bluebird';

const {MJpegStream, initMJpegServer} = mjpeg;

const should = chai.should();
chai.use(chaiAsPromised);

const MJPEG_SERVER_PORT = 8589;
const MJPEG_SERVER_URL = `http://localhost:${MJPEG_SERVER_PORT}`;

describe('MJpeg Stream (e2e)', function () {
  let mJpegServer, stream;

  before(async function () {
    // TODO: remove when buffertools can handle v12
    if (process.version.startsWith('v12')) {
      return this.skip();
    }

    mJpegServer = await initMJpegServer(MJPEG_SERVER_PORT);
  });

  after(function () {
    if (mJpegServer) {
      mJpegServer.close();
    }
    if (stream) {
      stream.stop(); // ensure streams are always stopped
    }
  });

  it('should update mjpeg stream based on new data from mjpeg server', async function () {
    stream = new MJpegStream(MJPEG_SERVER_URL, _.noop);
    should.not.exist(stream.lastChunk);
    await stream.start();
    should.exist(stream.lastChunk);
    stream.updateCount.should.eql(1);

    await B.delay(1000); // let the stream update a bit
    stream.updateCount.should.be.above(1);

    // verify jpeg type and byte length of fixture image
    const startBytes = Buffer.from([0xff, 0xd8]);
    const endBytes = Buffer.from([0xff, 0xd9]);
    const startPos = stream.lastChunk.indexOf(startBytes);
    const endPos = stream.lastChunk.indexOf(endBytes);
    startPos.should.eql(0); // proves we have a jpeg
    endPos.should.eql(1278); // proves we have a jpeg of the right size

    // verify we can get the base64 version too
    const b64 = stream.lastChunkBase64;
    b64.should.eql(mjpeg.TEST_IMG_JPG);

    // verify we can get the PNG version too
    const png = await stream.lastChunkPNGBase64();
    png.should.be.a('string');
    png.indexOf('iVBOR').should.eql(0);
    png.length.should.be.above(400);


    // now stop the stream and wait some more then assert no new data has come in
    stream.stop();
    await B.delay(1000);
    should.not.exist(stream.lastChunk);
    stream.updateCount.should.eql(0);
  });

  it('should error out if the server does not send any images before a timeout', async function () {
    stream = new MJpegStream(MJPEG_SERVER_URL, _.noop);
    await stream.start(0).should.eventually.be.rejectedWith(/never sent/);
  });

});
