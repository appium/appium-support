import { base64ToImage, imageToBase64, cropImage,
         getMatchesCount, getSimilarityScore } from '../lib/image-util';
import path from 'path';
import chai from 'chai';
import {fs} from 'appium-support';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

async function getImage (file) {
  const imagePath = path.resolve(__dirname, '..', '..', 'test', 'images', file);
  return await fs.readFile(imagePath, 'utf8');
}

describe('image-util', function () {
  describe('cropBase64Image', function () {
    let originalImage = null;

    before(async function () {
      const originalImage64 = await getImage('full-image.b64');
      originalImage = await base64ToImage(originalImage64);

      // verify original image size, to be sure that original image is correct
      originalImage.width.should.be.equal(640, 'unexpected width');
      originalImage.height.should.be.equal(1136, 'unexpected height');
    });

    it('should verify that an image is cropped correctly', async function () {
      const croppedImage = await cropImage(originalImage, {left: 35, top: 107, width: 323, height: 485});

      // verify cropped image size, it should be less than original image according to crop region
      croppedImage.width.should.be.equal(323, 'unexpected width');
      croppedImage.height.should.be.equal(485, 'unexpected height');

      // verify that image cropped, compare base64 representation
      const croppedImageShouldBe = await getImage('cropped-image.b64');
      const croppedImage64 = await imageToBase64(croppedImage);
      croppedImage64.should.be.equal(croppedImageShouldBe);
    });
  });

  describe('OpenCV helpers', function () {
    let imgFixture = null;

    before(async function () {
      const imagePath = path.resolve(__dirname, '..', '..', 'test', 'images', 'full-image.b64');
      imgFixture = Buffer.from(await fs.readFile(imagePath, 'binary'), 'base64');
    });

    describe('getMatchesCount', function () {
      it('should calculate the number of matches between two images', async function () {
        // TODO: include OpenCV 3 libs on Travis
        if (process.env.CI) {
          return this.skip();
        }
        (await getMatchesCount(imgFixture, imgFixture, 'ORB')).should.be.above(0);
      });
    });

    describe('getSimilarityScore', function () {
      it('should calculate the similarity score between two images', async function () {
        // TODO: include OpenCV 3 libs on Travis
        if (process.env.CI) {
          return this.skip();
        }
        (await getSimilarityScore(imgFixture, imgFixture)).should.be.above(0);
      });
    });
  });
});
