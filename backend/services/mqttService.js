const mqtt = require('mqtt');
const Machine = require('../models/machine');
const MachineCounter = require('../models/MachineCounter');
const TelemetryRecord = require('../models/TelemetryRecord');
const HealthRecord = require('../models/HealthRecord');
const Alert = require('../models/alert');
const { emit } = require('./socketService');

const brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://test.mosquitto.org:1883';
const telemetryTopic = process.env.MQTT_TELEMETRY_TOPIC || 'devices/+/telemetry';
const safetyAlertsTopic = process.env.MQTT_SAFETY_ALERT_TOPIC || 'safety/alerts';
const offlineTimeoutMs = Number(process.env.MQTT_OFFLINE_TIMEOUT_MS || 10000);

let client = null;
let connectionState = 'DISCONNECTED';

function normaliseNumber(value) {
  return Number.isFinite(Number(value)) ? Number(value) : null;
}

function safeMean(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const total = values.reduce((sum, value) => sum + Number(value), 0);
  return total / values.length;
}

function validateTelemetryPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Telemetry payload must be an object');
  }

  if (typeof payload.device_id !== 'string' || payload.device_id.trim() === '') {
    throw new Error('device_id must be a non-empty string');
  }

  if (!Number.isFinite(Number(payload.timestamp))) {
    throw new Error('timestamp must be a numeric milliseconds value');
  }

  if (!Number.isFinite(Number(payload.sample_rate_hz)) || Number(payload.sample_rate_hz) <= 0) {
    throw new Error('sample_rate_hz must be a positive number');
  }

  const tempCandidate = payload.temp_c ?? payload.temperature;
  if (tempCandidate !== undefined && tempCandidate !== null && !Number.isFinite(Number(tempCandidate))) {
    throw new Error('temperature must be numeric when present');
  }

  const currentCandidate = payload.current_a ?? payload.current;
  if (currentCandidate !== undefined && currentCandidate !== null && !Number.isFinite(Number(currentCandidate))) {
    throw new Error('current must be numeric when present');
  }

  const accel = payload.accel;
  if (!accel || typeof accel !== 'object') {
    throw new Error('accel object is required');
  }

  ['x', 'y', 'z'].forEach((axis) => {
    if (!Array.isArray(accel[axis]) || accel[axis].length === 0) {
      throw new Error(`accel.${axis} must be a non-empty array`);
    }

    if (accel[axis].some((value) => !Number.isFinite(Number(value)))) {
      throw new Error(`accel.${axis} must contain only finite numbers`);
    }
  });

  const lengths = ['x', 'y', 'z'].map((axis) => accel[axis].length);
  if (new Set(lengths).size > 1) {
    throw new Error('accel axis arrays must have compatible lengths');
  }
}

function validateSafetyAlertPayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('Safety alert payload must be an object');
  }

  if (!Number.isFinite(Number(payload.timestamp))) {
    throw new Error('timestamp must be a Unix timestamp value');
  }

  if (!Array.isArray(payload.violations) || payload.violations.length === 0 || payload.violations.some((v) => typeof v !== 'string' || v.trim() === '')) {
    throw new Error('violations must be a non-empty string array');
  }

  if (typeof payload.image_base64 !== 'string' || payload.image_base64.trim() === '') {
    throw new Error('image_base64 must be a non-empty string');
  }

  try {
    const buffer = Buffer.from(payload.image_base64, 'base64');
    if (buffer.length === 0) {
      throw new Error('image_base64 decoded data is empty');
    }
  } catch (error) {
    throw new Error(`image_base64 must be valid base64: ${error.message}`);
  }
}

function computeCentredMagnitude(x, y, z) {
  const xMean = safeMean(x);
  const yMean = safeMean(y);
  const zMean = safeMean(z);

  const centeredX = x.map((value) => Number(value) - xMean);
  const centeredY = y.map((value) => Number(value) - yMean);
  const centeredZ = z.map((value) => Number(value) - zMean);

  return centeredX.map((_, index) => {
    const mag = Math.sqrt(
      centeredX[index] * centeredX[index] +
      centeredY[index] * centeredY[index] +
      centeredZ[index] * centeredZ[index],
    );

    return Number(mag.toFixed(12));
  });
}

function computeRms(signal) {
  if (!Array.isArray(signal) || signal.length === 0) {
    throw new Error('signal must be a non-empty array');
  }

  const meanSquare = signal.reduce((sum, value) => sum + value * value, 0) / signal.length;
  return Number(Math.sqrt(meanSquare).toFixed(12));
}

function computePeakAcceleration(signal) {
  if (!Array.isArray(signal) || signal.length === 0) {
    throw new Error('signal must be a non-empty array');
  }

  return Number(Math.max(...signal.map((value) => Math.abs(value))).toFixed(12));
}

function computeSpectrumBins(signal, sampleRateHz) {
  if (!Array.isArray(signal) || signal.length === 0) {
    throw new Error('signal must be a non-empty array');
  }

  const sampleRate = Number(sampleRateHz) || signal.length;
  const n = signal.length;
  const bins = [];

  for (let k = 0; k <= Math.floor(n / 2); k += 1) {
    let real = 0;
    let imaginary = 0;

    for (let i = 0; i < n; i += 1) {
      const angle = (2 * Math.PI * k * i) / n;
      real += signal[i] * Math.cos(angle);
      imaginary -= signal[i] * Math.sin(angle);
    }

    const amplitude = Math.sqrt(real * real + imaginary * imaginary) / n;
    const frequency = (k / n) * sampleRate;
    bins.push({ frequency: Number(frequency.toFixed(6)), amplitude: Number(amplitude.toFixed(12)) });
  }

  return bins;
}

function computeHealthScore(rms, peak, thresholdOverrides = {}) {
  const warningRms = thresholdOverrides.vibrationRms?.warning || 4.5;
  const criticalRms = thresholdOverrides.vibrationRms?.critical || 7.1;
  const warningPeak = thresholdOverrides.peakAcceleration?.warning || 2;
  const criticalPeak = thresholdOverrides.peakAcceleration?.critical || 4;

  if (rms >= criticalRms || peak >= criticalPeak) {
    return { healthScore: 28, status: 'red' };
  }

  if (rms >= warningRms || peak >= warningPeak) {
    return { healthScore: 62, status: 'yellow' };
  }

  return { healthScore: 92, status: 'green' };
}

function extractTopicDeviceId(topic) {
  if (!topic || typeof topic !== 'string') return null;
  const match = /^devices\/([^/]+)\/telemetry$/i.exec(topic.trim());
  return match ? match[1] : null;
}

async function getNextMachineId() {
  let attempts = 0;

  while (attempts < 10) {
    const counter = await MachineCounter.findOneAndUpdate(
      { _id: 'machines' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );

    const candidate = `MCH-${String(counter.seq).padStart(3, '0')}`;
    const existing = await Machine.findOne({ machineId: candidate }).lean();
    if (!existing) {
      return candidate;
    }

    attempts += 1;
  }

  throw new Error('Unable to allocate a unique machine ID for MQTT device');
}

async function ensureMachineForDevice(deviceId) {
  const normalizedDeviceId = String(deviceId || '').trim();
  if (!normalizedDeviceId) {
    throw new Error('deviceId is required to auto-create a machine');
  }

  let machine = await Machine.findOne({ deviceId: normalizedDeviceId }).lean();
  if (machine) {
    return machine;
  }

  let attempts = 0;
  while (attempts < 10) {
    const machineId = await getNextMachineId();
    const lastSeen = new Date();

    try {
      machine = await Machine.findOneAndUpdate(
        { deviceId: normalizedDeviceId },
        {
          $setOnInsert: {
            machineId,
            deviceId: normalizedDeviceId,
            name: normalizedDeviceId,
            zone: 'Unassigned',
            type: 'IoT Machine',
            enabled: true,
            status: 'ONLINE',
            connectionStatus: 'ONLINE',
            source: 'MQTT',
            lastSeen,
            thresholds: {
              vibrationRms: { warning: 4.5, critical: 7.1 },
              peakAcceleration: { warning: 2.0, critical: 4.0 },
            },
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

      if (machine) {
        break;
      }
    } catch (error) {
      if (error.code === 11000) {
        machine = await Machine.findOne({ deviceId: normalizedDeviceId }).lean();
        if (machine) {
          return machine;
        }
      } else {
        throw error;
      }
    }

    attempts += 1;
  }

  machine = await Machine.findOne({ deviceId: normalizedDeviceId }).lean();
  if (!machine) {
    throw new Error('Unable to create or resolve MQTT machine record');
  }

  emit('machine:created', { machine });
  emit('dashboard:updated');

  const existingAlert = await Alert.findOne({
    type: 'MACHINE_ADDED',
    'metadata.deviceId': normalizedDeviceId,
  }).lean();

  if (!existingAlert) {
    await Alert.create({
      type: 'MACHINE_ADDED',
      category: 'MACHINE',
      severity: 'INFO',
      title: 'New machine discovered',
      message: `MQTT device "${normalizedDeviceId}" was detected and added to LABES.`,
      sourceType: 'MACHINE',
      sourceId: machine.machineId,
      visibleTo: 'ALL',
      metadata: { deviceId: normalizedDeviceId, source: 'MQTT' },
    });

    emit('alert:created', { alert: { type: 'MACHINE_ADDED', message: `MQTT device "${normalizedDeviceId}" was detected and added to LABES.` } });
  }

  return machine;
}

async function mapDeviceToMachine(deviceId) {
  const normalizedDeviceId = String(deviceId || '').trim();
  if (!normalizedDeviceId) {
    return null;
  }

  const machine = await Machine.findOne({ deviceId: normalizedDeviceId }).lean();
  if (!machine) {
    return ensureMachineForDevice(normalizedDeviceId);
  }
  return machine;
}

async function processTelemetryPayload(rawPayload, topic = null) {
  validateTelemetryPayload(rawPayload);

  const deviceId = rawPayload.device_id.trim();
  const topicDeviceId = extractTopicDeviceId(topic);
  if (topicDeviceId && topicDeviceId !== deviceId) {
    console.warn(`[mqtt] topic/device mismatch: topic=${topicDeviceId} payload=${deviceId}; packet rejected`);
    return null;
  }

  const timestampMs = Number(rawPayload.timestamp);
  const sampleRateHz = Number(rawPayload.sample_rate_hz);
  const temperature = rawPayload.temp_c ?? rawPayload.temperature ?? null;
  const current = rawPayload.current_a ?? rawPayload.current ?? null;
  const numericTemperature = temperature === null || temperature === undefined ? null : Number(temperature);
  const numericCurrent = current === null || current === undefined ? null : Number(current);
  const x = rawPayload.accel.x.map((value) => Number(value));
  const y = rawPayload.accel.y.map((value) => Number(value));
  const z = rawPayload.accel.z.map((value) => Number(value));

  let vibrationRms = null;
  let peakAcceleration = null;
  if (rawPayload.stats && typeof rawPayload.stats === 'object') {
    const statsAxes = ['x', 'y', 'z'];
    const axisRms = statsAxes.map((axis) => Number(rawPayload.stats?.[axis]?.rms)).filter(Number.isFinite);
    const axisPeak = statsAxes.map((axis) => Number(rawPayload.stats?.[axis]?.peak)).filter(Number.isFinite);
    if (axisRms.length >= 3) {
      vibrationRms = safeMean(axisRms);
    }
    if (axisPeak.length >= 3) {
      peakAcceleration = Math.max(...axisPeak);
    }
  }

  let machine = await Machine.findOne({ deviceId }).lean();
  if (!machine) {
    machine = await ensureMachineForDevice(deviceId);
  }

  const magnitudeSignal = computeCentredMagnitude(x, y, z);
  if (!Number.isFinite(vibrationRms)) {
    vibrationRms = computeRms(magnitudeSignal);
  }
  if (!Number.isFinite(peakAcceleration)) {
    peakAcceleration = computePeakAcceleration(magnitudeSignal);
  }
  const fftSpectrum = computeSpectrumBins(magnitudeSignal, sampleRateHz);
  const fftBands = fftSpectrum.map((bin) => Number(bin.amplitude.toFixed(12)));

  const telemetryTimestamp = new Date(timestampMs);
  const thresholdConfig = machine.thresholds || {};
  const { healthScore, status } = computeHealthScore(vibrationRms, peakAcceleration, thresholdConfig);

  const telemetryRecord = await TelemetryRecord.create({
    machineId: machine.machineId,
    deviceId,
    timestamp: telemetryTimestamp,
    sampleRateHz,
    temperature: numericTemperature,
    current: numericCurrent,
    accel: { x, y, z },
    magnitude: magnitudeSignal,
    vibrationRms,
    peakAcceleration,
    fftBands,
    fftSpectrum,
    createdAt: new Date(),
  });

  const healthRecord = await HealthRecord.findOneAndUpdate(
    { machineId: machine.machineId, timestamp: telemetryTimestamp },
    {
      $set: {
        machineId: machine.machineId,
        deviceId,
        timestamp: telemetryTimestamp,
        sampleRateHz,
        temperature: numericTemperature,
        current: numericCurrent,
        vibrationRms,
        peakAcceleration,
        rms: vibrationRms,
        peak: peakAcceleration,
        fftBands,
        fftSpectrum,
        accel: { x, y, z },
        vibrationPreview: magnitudeSignal.slice(0, 256),
        healthScore,
        anomalyScore: Number(Math.max(0, Math.min(1, (100 - healthScore) / 100)).toFixed(4)),
        status,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
    },
  );

  await Machine.findOneAndUpdate(
    { machineId: machine.machineId },
    {
      $set: {
        deviceId,
        status: 'ONLINE',
        connectionStatus: 'ONLINE',
        lastSeen: telemetryTimestamp,
      },
    },
    { new: true },
  );

  emit('machine:telemetry', {
    machineId: machine.machineId,
    deviceId,
    timestamp: telemetryTimestamp.toISOString(),
    sampleRateHz,
    vibrationRms,
    peakAcceleration,
    fftBands,
    fftSpectrum,
    accel: { x, y, z },
  });

  emit('machine:health-updated', {
    machineId: machine.machineId,
    health: {
      machineId: machine.machineId,
      deviceId,
      timestamp: telemetryTimestamp.toISOString(),
      sampleRateHz,
      temperature: numericTemperature,
      current: numericCurrent,
      rms: vibrationRms,
      peak: peakAcceleration,
      fftBands,
      vibrationPreview: magnitudeSignal.slice(0, 256),
      healthScore,
      status,
    },
    machine: {
      ...machine,
      deviceId,
      status: 'ONLINE',
      lastSeen: telemetryTimestamp.toISOString(),
    },
  });

  emit('dashboard:updated');

  return { machine, telemetryRecord, healthRecord, vibrationRms, peakAcceleration, fftSpectrum };
}

function normaliseSafetyViolationToEvent(violations) {
  const normalized = Array.isArray(violations) ? violations.map((v) => String(v).trim().toLowerCase()) : [];

  if (normalized.some((v) => v.includes('fall'))) {
    return 'fall_detected';
  }

  if (normalized.some((v) => v.includes('hardhat') || v.includes('helmet'))) {
    return 'no_helmet';
  }

  if (normalized.some((v) => v.includes('zone') || v.includes('restricted'))) {
    return 'restricted_zone_entry';
  }

  return 'unsafe_distance';
}

function createSafetyEventFromPayload(payload) {
  const timestampSeconds = Number(payload.timestamp);
  const date = new Date(timestampSeconds * 1000);
  const event = normaliseSafetyViolationToEvent(payload.violations);
  const eventId = `safety-${date.getTime()}-${Math.round(Math.random() * 1e9)}`;
  const imageDataUrl = `data:image/jpeg;base64,${payload.image_base64}`;

  return {
    event_id: eventId,
    timestamp: date.toISOString(),
    node_id: 'safety-cv-node',
    zone: 'Zone 1',
    event,
    person_track_id: 1,
    status: 'open',
    violations: payload.violations,
    snapshot_url: imageDataUrl,
    confidence: 1,
  };
}

function processSafetyAlertPayload(payload) {
  validateSafetyAlertPayload(payload);
  const safetyEvent = createSafetyEventFromPayload(payload);

  emit('safety:alert', { event: safetyEvent });
  emit('safety:event', { event: safetyEvent });
  emit('safety:updated', { event: safetyEvent });
  emit('dashboard:updated');

  return safetyEvent;
}

function getConnectionState() {
  return connectionState;
}

function connectMqtt() {
  if (client) {
    return client;
  }

  client = mqtt.connect(brokerUrl, {
    reconnectPeriod: 5000,
    clientId: `labes-mqtt-${Date.now()}`,
  });

  client.on('connect', () => {
    connectionState = 'CONNECTED';
    console.log('[mqtt] MQTT connected');
    console.log(`[mqtt] broker=${brokerUrl}`);

    client.subscribe(telemetryTopic, (err) => {
      if (err) {
        console.error('[mqtt] subscribe failed', err.message);
        connectionState = 'ERROR';
      } else {
        console.log(`[mqtt] Subscribed to ${telemetryTopic}`);
      }
    });

    client.subscribe(safetyAlertsTopic, (err) => {
      if (err) {
        console.error('[mqtt] safety subscribe failed', err.message);
        connectionState = 'ERROR';
      } else {
        console.log(`[mqtt] Subscribed to ${safetyAlertsTopic}`);
      }
    });
  });

  client.on('reconnect', () => {
    connectionState = 'RECONNECTING';
    console.log('[mqtt] reconnecting to broker');
  });

  client.on('error', (error) => {
    connectionState = 'ERROR';
    console.error('[mqtt] broker error', error.message);
  });

  client.on('close', () => {
    connectionState = 'DISCONNECTED';
    console.log('[mqtt] broker disconnected');
  });

  client.on('message', async (topic, message) => {
    if (!topic || typeof topic !== 'string') {
      return;
    }

    try {
      const raw = JSON.parse(message.toString());

      if (topic === safetyAlertsTopic) {
        const safetyEvent = processSafetyAlertPayload(raw);
        console.log(`[mqtt] processed safety alert event=${safetyEvent.event} violations=${safetyEvent.violations.join('|')}`);
        return;
      }

      const topicDeviceId = extractTopicDeviceId(topic);
      if (!topicDeviceId) {
        return;
      }

      if (raw?.device_id && raw.device_id !== topicDeviceId) {
        console.warn(`[mqtt] Packet rejected: topic ${topic} device_id ${raw.device_id} mismatch`);
        return;
      }

      const result = await processTelemetryPayload(raw, topic);
      if (result) {
        console.log(`[mqtt] processed ${result.machine.deviceId} RMS=${result.vibrationRms.toFixed(4)}`);
      }
    } catch (error) {
      console.warn(`[mqtt] invalid packet ignored: ${error.message}`);
    }
  });

  return client;
}

module.exports = {
  connectMqtt,
  getConnectionState,
  processTelemetryPayload,
  processSafetyAlertPayload,
  validateTelemetryPayload: validateTelemetryPayload,
  validateSafetyAlertPayload,
  computeCentredMagnitude,
  computeRms,
  computePeakAcceleration,
  computeSpectrumBins,
  offlineTimeoutMs,
};
