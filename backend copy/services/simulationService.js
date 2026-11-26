const SCENARIOS = {
  HEALTHY: {
    temperature: 39,
    current: 0.8,
    amplitude: 0.18,
    noise: 0.015,
    targetScore: 92,
  },
  WARNING: {
    temperature: 58,
    current: 1.2,
    amplitude: 0.95,
    noise: 0.08,
    targetScore: 65,
  },
  CRITICAL: {
    temperature: 76,
    current: 1.8,
    amplitude: 2.1,
    noise: 0.18,
    targetScore: 30,
  },
};

function createSimulatedVibration({ amplitude, noise }, samples = 64) {
  return Array.from({ length: samples }, (_, index) => {
    const base = Math.sin((2 * Math.PI * index) / samples) * amplitude;
    const harmonic = Math.sin((6 * Math.PI * index) / samples) * amplitude * 0.25;
    const deterministicNoise = Math.sin(index * 12.9898) * noise;
    return Number((base + harmonic + deterministicNoise).toFixed(6));
  });
}

function buildSimulatedPayload(scenarioName = 'HEALTHY', machineId = 'machine-01') {
  const scenario = SCENARIOS[String(scenarioName).toUpperCase()] || SCENARIOS.HEALTHY;

  return {
    machineId,
    name: machineId === 'machine-01' ? 'Industrial Motor 01' : machineId,
    zone: machineId === 'machine-01' ? 'Zone 1' : 'Unassigned Zone',
    timestamp: Date.now(),
    vibration: createSimulatedVibration(scenario),
    temperature: scenario.temperature,
    current: scenario.current,
    scenario: String(scenarioName).toUpperCase(),
    targetScore: scenario.targetScore,
  };
}

module.exports = {
  SCENARIOS,
  buildSimulatedPayload,
};
