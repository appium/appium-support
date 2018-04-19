import { base64ToImage, imageToBase64, cropImage,
         getImagesMatches, getImagesSimilarity, getImageOccurrence } from '../lib/image-util';
import path from 'path';
import chai from 'chai';
import { fs } from 'appium-support';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const FIXTURES_ROOT = path.resolve(__dirname, '..', '..', 'test', 'images');

async function getImage (name) {
  const imagePath = path.resolve(FIXTURES_ROOT, name);
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
    // TODO: include OpenCV 3 libs on Travis
    let imgFixture = null;
    let fullImage = null;
    let partialImage = null;
    let originalImage = null;
    let changedImage = null;
    let rotatedImage = null;

    before(async function () {
      const imagePath = path.resolve(FIXTURES_ROOT, 'full-image.b64');
      imgFixture = Buffer.from(await fs.readFile(imagePath, 'binary'), 'base64');
      fullImage = await fs.readFile(path.resolve(FIXTURES_ROOT, 'findwaldo.jpg'));
      partialImage = await fs.readFile(path.resolve(FIXTURES_ROOT, 'waldo.jpg'));
      originalImage = await fs.readFile(path.resolve(FIXTURES_ROOT, 'cc1.png'));
      changedImage = await fs.readFile(path.resolve(FIXTURES_ROOT, 'cc2.png'));
      rotatedImage = await fs.readFile(path.resolve(FIXTURES_ROOT, 'cc_rotated.png'));
    });

    describe('getImagesMatches', function () {
      it('should calculate the number of matches between two images', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        for (const detectorName of ['AKAZE', 'ORB']) {
          const {count, totalCount} = await getImagesMatches(fullImage, fullImage, {detectorName});
          count.should.be.above(0);
          totalCount.should.eql(count);
        }
      });

      it('should visualize matches between two images', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        const {visualization} = await getImagesMatches(fullImage, fullImage, {visualize: true});
        visualization.should.not.be.empty;
      });

      it('should visualize matches between two images and apply goodMatchesFactor', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        const {visualization, points1, rect1, points2, rect2} = await getImagesMatches(rotatedImage, originalImage, {
          visualize: true,
          matchFunc: 'BruteForceHamming',
          goodMatchesFactor: 40
        });
        visualization.should.not.be.empty;
        points1.length.should.be.above(4);
        rect1.x.should.be.above(0);
        rect1.y.should.be.above(0);
        rect1.width.should.be.above(0);
        rect1.height.should.be.above(0);
        points2.length.should.be.above(4);
        rect2.x.should.be.above(0);
        rect2.y.should.be.above(0);
        rect2.width.should.be.above(0);
        rect2.height.should.be.above(0);
      });
    });

    describe('getImagesSimilarity', function () {
      it('should calculate the similarity score between two images', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        const {score} = await getImagesSimilarity(imgFixture, imgFixture);
        score.should.be.above(0);
      });

      it('should visualize the similarity between two images', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        const {visualization} = await getImagesSimilarity(originalImage, changedImage, {visualize: true});
        visualization.should.not.be.empty;
      });
    });

    describe('getImageOccurrence', function () {
      it('should calculate the partial image position in the full image', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        const {rect} = await getImageOccurrence(fullImage, partialImage);
        rect.x.should.be.above(0);
        rect.y.should.be.above(0);
        rect.width.should.be.above(0);
        rect.height.should.be.above(0);
      });

      it('should visualize the partial image position in the full image', async function () {
        if (process.env.CI) {
          return this.skip();
        }
        const {visualization} = await getImageOccurrence(fullImage, partialImage, {visualize: true});
        visualization.should.not.be.empty;
      });
    });
  });
});
