import _ from 'lodash';
import { Buffer } from 'buffer';
import { PNG } from 'pngjs';
import B from 'bluebird';
let cv = null;

/**
 * @typedef {Object} Region
 * @property {number} left - The offset from the left side
 * @property {number} top - The offset from the top
 * @property {number} width - The width
 * @property {number} height - The height
 */

/**
 * @typedef {Object} Point
 * @property {number} x - The x coordinate
 * @property {number} y - The y coordinate
 */

const BYTES_IN_PIXEL_BLOCK = 4;
const SCANLINE_FILTER_METHOD = 4;

const AVAILABLE_DETECTORS = [
  'AKAZE',
  'AGAST',
  'BRISK',
  'FAST',
  'GFTT',
  'KAZE',
  'MSER',
  'ORB',
];

/**
 * @throws {Error} If opencv4nodejs module is not installed or cannot be loaded
 */
function initOpenCV () {
  if (!cv) {
    try {
      cv = require('opencv4nodejs');
    } catch (ign) {}
  }
  if (!cv) {
    throw new Error('opencv4nodejs module is required to use OpenCV features. ' +
                    'Please install it first (npm i -g opencv4nodejs) and restart node. ' +
                    'Read https://github.com/justadudewhohacks/opencv4nodejs#how-to-install for more details on this topic.');
  }
}

/**
 * Calculates an OpenCV match descriptor of an image, which can be used
 * for brute-force matching.
 * Read https://docs.opencv.org/3.0-beta/doc/py_tutorials/py_feature2d/py_matcher/py_matcher.html
 * for more details.
 *
 * @param {Buffer} imgData image data packed into a NodeJS buffer
 * @param {cv.FeatureDetector} detector OpenCV feature detector instance
 *
 * @returns {cv.DescriptorMatch} OpenCV match descriptor
 */
async function detectAndCompute (imgData, detector) {
  const img = await cv.imdecodeAsync(imgData);
  const keyPoints = await detector.detectAsync(img);
  return await detector.computeAsync(img, keyPoints);
}

/**
 * Calculates the count of common edges between two images.
 * The images might be rotated or resized relatively to each other.
 *
 * @param {Buffer} imgData1 the data of the first image packed into a NodeJS buffer
 * @param {Buffer} imgData2 the data of the second image packed into a NodeJS buffer
 * @param {string} detectorName one of possible OpenCV feature detector names:
 * AKAZE, AGAST, BRISK, FAST, GFTT, KAZE, MSER, ORB
 *
 * @returns {number} The count of detected matches between the two images. Zero is returned
 * if no matches are found.
 * @throws {Error} If `detectorName` value is unknown.
 */
async function getMatchesCount (imgData1, imgData2, detectorName) {
  initOpenCV();

  if (!_.includes(AVAILABLE_DETECTORS, detectorName)) {
    throw new Error(`'${detectorName}' detector is unknown. ` +
                    `Only ${JSON.stringify(AVAILABLE_DETECTORS)} detectors are supported.`);
  }

  const detector = new cv[`${detectorName}Detector`]();
  const [descriptor1, descriptor2] = await B.all([
    detectAndCompute(imgData1, detector),
    detectAndCompute(imgData2, detector)
  ]);
  const matches = await cv.matchBruteForceAsync(descriptor1, descriptor2);
  return matches.length;
}

/**
 * Calculates the similarity score between two images.
 * It is expected, that both images have the same resolution.
 *
 * @param {Buffer} templateData The data of the first image packed into a NodeJS buffer
 * @param {Buffer} referenceData The data of the second image packed into a NodeJS buffer
 *
 * @returns {number} The similarity score as a float number in range [0.0, 1.0].
 * 1.0 is the highest score (means both images are totally equal).
 * @throws {Error} If the given images have different resolution.
 */
async function getSimilarityScore (templateData, referenceData) {
  initOpenCV();

  let template = await cv.imdecodeAsync(templateData);
  let reference = await cv.imdecodeAsync(referenceData);
  if (template.rows !== reference.rows || template.cols !== reference.cols) {
    throw new Error('Both images are expected to have the same size in order to ' +
                    'calculate the similarity score.');
  }
  template = await template.convertToAsync(cv.CV_8UC3);
  reference = await reference.convertToAsync(cv.CV_8UC3);

  const matched = await reference.matchTemplateAsync(template, cv.TM_CCOEFF_NORMED);
  const minMax = await matched.minMaxLocAsync();
  return minMax.maxVal;
}

/**
 * Calculates the occurence position of a partial image in the full
 * image.
 *
 * @param {Buffer} fullImgData The data of the full image packed into a NodeJS buffer
 * @param {Buffer} partialImgData The data of the partial image packed into a NodeJS buffer
 *
 * @returns {Point} The absolute coordinates of the partial image occurence
 * @throws {Error} If no occurences of the partial image can be found in the full image
 */
async function getMatchPosition (fullImgData, partialImgData) {
  initOpenCV();

  const fullImg = await cv.imdecodeAsync(fullImgData);
  const partialImg = await cv.imdecodeAsync(partialImgData);
  try {
    const matched = await fullImg.matchTemplateAsync(partialImg, cv.TM_CCOEFF_NORMED);
    const minMax = await matched.minMaxLocAsync();
    return minMax.maxLoc;
  } catch (e) {
    throw new Error(`Cannot find any occurences of the partial image in the full image. ` +
                    `Original error: ${e}`);
  }
}

/**
 * Crop the image by given rectangle (use base64 string as input and output)
 *
 * @param {string} base64Image The string with base64 encoded image
 * @param {Region} rect The selected region of image
 * @return {string} base64 encoded string of cropped image
 */
async function cropBase64Image (base64Image, rect) {
  const image = await base64ToImage(base64Image);
  cropImage(image, rect);
  return await imageToBase64(image);
}

/**
 * Create a pngjs image from given base64 image
 *
 * @param {string} base64Image The string with base64 encoded image
 * @return {PNG} The image object
 */
async function base64ToImage (base64Image) {
  const imageBuffer = new Buffer(base64Image, 'base64');
  return new B((resolve, reject) => {
    const image = new PNG({filterType: SCANLINE_FILTER_METHOD});
    image.parse(imageBuffer, (err, image) => { // eslint-disable-line promise/prefer-await-to-callbacks
      if (err) {
        return reject(err);
      }
      resolve(image);
    });
  });
}

/**
 * Create a base64 string for given image object
 *
 * @param {PNG} image The image object
 * @return {string} The string with base64 encoded image
 */
async function imageToBase64 (image) {
  return new B((resolve, reject) => {
    const chunks = [];
    image.pack()
    .on('data', (chunk) => chunks.push(chunk)).on('end', () => {
      resolve(Buffer.concat(chunks).toString('base64'));
    })
    .on('error', (err) => { // eslint-disable-line promise/prefer-await-to-callbacks
      reject(err);
    });
  });
}

/**
 * Crop the image by given rectangle
 *
 * @param {PNG} image The image to mutate by cropping
 * @param {Region} rect The selected region of image
 */
function cropImage (image, rect) {
  const imageRect = {width: image.width, height: image.height};
  const interRect = getRectIntersection(rect, imageRect);
  if (interRect.width < rect.width || interRect.height < rect.height) {
    throw new Error(`Cannot crop ${JSON.stringify(rect)} from ${JSON.stringify(imageRect)} because the intersection between them was not the size of the rect`);
  }

  const firstVerticalPixel = interRect.top;
  const lastVerticalPixel = interRect.top + interRect.height;

  const firstHorizontalPixel = interRect.left;
  const lastHorizontalPixel = interRect.left + interRect.width;

  const croppedArray = [];
  for (let y = firstVerticalPixel; y < lastVerticalPixel; y++) {
    for (let x = firstHorizontalPixel; x < lastHorizontalPixel; x++) {
      const firstByteIdxInPixelBlock = (imageRect.width * y + x) << 2;
      for (let byteIdx = 0; byteIdx < BYTES_IN_PIXEL_BLOCK; byteIdx++) {
        croppedArray.push(image.data[firstByteIdxInPixelBlock + byteIdx]);
      }
    }
  }

  image.data = new Buffer(croppedArray);
  image.width = interRect.width;
  image.height = interRect.height;
  return image;
}

function getRectIntersection (rect, imageSize) {
  const left = rect.left >= imageSize.width ? imageSize.width : rect.left;
  const top = rect.top >= imageSize.height ? imageSize.height : rect.top;
  const width = imageSize.width >= (left + rect.width) ? rect.width : (imageSize.width - left);
  const height = imageSize.height >= (top + rect.height) ? rect.height : (imageSize.height - top);
  return {left, top, width, height};
}

export { cropBase64Image, base64ToImage, imageToBase64, cropImage,
         getMatchesCount, getSimilarityScore, getMatchPosition };
