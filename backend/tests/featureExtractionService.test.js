const test = require('node:test');
const assert = require('node:assert/strict');
const {
  calculatePeak,
  calculateRms,
  calculateSpectrum,
  extractFeatures,
} = require('../services/featureExtractionService');

test('calculates RMS for a constant signal', () => {
  assert.equal(calculateRms([2, 2, 2, 2]), 2);
});

test('calculates peak from absolute values', () => {
  assert.equal(calculatePeak([0.2, -4, 1.1]), 4);
});

test('rejects empty vibration payload', () => {
  assert.throws(() => calculateRms([]), /must not be empty/);
});

test('rejects invalid vibration payload', () => {
  assert.throws(() => extractFeatures([0.1, Number.NaN]), /finite numbers/);
});

test('produces FFT energy for a simple sinusoidal signal', () => {
  const signal = Array.from({ length: 32 }, (_, index) => Math.sin((2 * Math.PI * index) / 32));
  const spectrum = calculateSpectrum(signal);
  const strongestBin = spectrum.indexOf(Math.max(...spectrum));

  assert.equal(strongestBin, 1);
});

test('captures a peak in extracted features', () => {
  const features = extractFeatures([0, 0, 5, 0], { bandCount: 4 });

  assert.equal(features.peak, 5);
  assert.equal(features.fft_bands.length, 4);
});
