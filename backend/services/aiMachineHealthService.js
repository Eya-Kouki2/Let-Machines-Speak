const DEFAULT_THRESHOLDS = {
  green: Number(process.env.MACHINE_HEALTH_GREEN_THRESHOLD || 80),
  yellow: Number(process.env.MACHINE_HEALTH_YELLOW_THRESHOLD || 50),
};

function statusFromScore(score, thresholds = DEFAULT_THRESHOLDS) {
  if (score >= thresholds.green) {
    return 'green';
  }

  if (score >= thresholds.yellow) {
    return 'yellow';
  }

  return 'red';
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

async function mockPredict(features, options = {}) {
  const thresholds = options.thresholds || DEFAULT_THRESHOLDS;
  const fftEnergy = Array.isArray(features.fft_bands)
    ? features.fft_bands.reduce((total, value) => total + Math.abs(value), 0)
    : 0;

  const vibrationPenalty = features.rms * 18 + features.peak * 10 + fftEnergy * 4;
  const healthScore = clampScore(100 - vibrationPenalty);

  return {
    health_score: healthScore,
    status: statusFromScore(healthScore, thresholds),
  };
}

module.exports = {
  DEFAULT_THRESHOLDS,
  mockPredict,
  statusFromScore,
};
