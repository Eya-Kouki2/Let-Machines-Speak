const DEFAULT_FFT_BANDS = Number(process.env.MACHINE_HEALTH_FFT_BANDS || 8);

function assertValidVibration(vibration) {
  if (!Array.isArray(vibration)) {
    throw new Error('vibration must be an array');
  }

  if (vibration.length === 0) {
    throw new Error('vibration must not be empty');
  }

  if (!vibration.every((value) => Number.isFinite(value))) {
    throw new Error('vibration values must be finite numbers');
  }
}

function calculateRms(vibration) {
  assertValidVibration(vibration);
  const meanSquare = vibration.reduce((total, value) => total + value * value, 0) / vibration.length;
  return Math.sqrt(meanSquare);
}

function calculatePeak(vibration) {
  assertValidVibration(vibration);
  return Math.max(...vibration.map((value) => Math.abs(value)));
}

function calculateSpectrum(vibration) {
  assertValidVibration(vibration);
  const sampleCount = vibration.length;
  const binCount = Math.floor(sampleCount / 2) + 1;
  const spectrum = [];

  for (let bin = 0; bin < binCount; bin += 1) {
    let real = 0;
    let imaginary = 0;

    for (let sample = 0; sample < sampleCount; sample += 1) {
      const angle = (2 * Math.PI * bin * sample) / sampleCount;
      real += vibration[sample] * Math.cos(angle);
      imaginary -= vibration[sample] * Math.sin(angle);
    }

    spectrum.push(Math.sqrt(real * real + imaginary * imaginary) / sampleCount);
  }

  return spectrum;
}

function calculateFftBands(vibration, bandCount = DEFAULT_FFT_BANDS) {
  if (!Number.isInteger(bandCount) || bandCount <= 0) {
    throw new Error('bandCount must be a positive integer');
  }

  const spectrum = calculateSpectrum(vibration);
  const bands = [];

  for (let band = 0; band < bandCount; band += 1) {
    const start = Math.floor((band * spectrum.length) / bandCount);
    const end = Math.floor(((band + 1) * spectrum.length) / bandCount);
    const slice = spectrum.slice(start, Math.max(start + 1, end));
    const average = slice.reduce((total, value) => total + value, 0) / slice.length;
    bands.push(Number(average.toFixed(6)));
  }

  return bands;
}

function extractFeatures(vibration, options = {}) {
  const rms = calculateRms(vibration);
  const peak = calculatePeak(vibration);
  const fftBands = calculateFftBands(vibration, options.bandCount || DEFAULT_FFT_BANDS);

  return {
    rms: Number(rms.toFixed(6)),
    peak: Number(peak.toFixed(6)),
    fft_bands: fftBands,
  };
}

module.exports = {
  calculateFftBands,
  calculatePeak,
  calculateRms,
  calculateSpectrum,
  extractFeatures,
};
