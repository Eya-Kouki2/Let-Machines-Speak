const mongoose = require('mongoose');
const mqttService = require('../services/mqttService');
const Machine = require('../models/machine');
const HealthRecord = require('../models/HealthRecord');

(async () => {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/let-machines-speak');

  await Machine.deleteMany({ deviceId: 'node01' });
  await HealthRecord.deleteMany({ deviceId: 'node01' });

  const payload = {
    device_id: 'node01',
    timestamp: 1737000000123,
    sample_rate_hz: 500,
    label: 'unlabeled',
    accel: {
      x: [0.532, 0.541, 0.528, 0.535, 0.530],
      y: [0.897, 0.903, 0.891, 0.900, 0.905],
      z: [-9.512, -9.498, -9.531, -9.520, -9.525],
    },
    stats: {
      x: { rms: 0.412, peak: 1.203, crest: 2.92 },
      y: { rms: 0.387, peak: 1.098, crest: 2.84 },
      z: { rms: 0.521, peak: 1.876, crest: 3.60 },
    },
    temp_c: null,
    current_a: 0.0412,
    bus_voltage_v: 9.124,
    power_mw: 376.0,
    filter_meta: { alpha: 0.2, window: 9, est_hz: 13.7, auto: true },
  };

  const res = await mqttService.processTelemetryPayload(payload, 'devices/node01/telemetry');

  console.log('machineId=', res.machine.machineId);
  console.log('healthRecord.current=', res.healthRecord.current);
  console.log('healthRecord.temperature=', res.healthRecord.temperature);
  console.log('healthRecord.rms=', res.healthRecord.rms);
  console.log('healthRecord.peak=', res.healthRecord.peak);

  const dbHealth = await HealthRecord.findOne({ deviceId: 'node01' }).sort({ timestamp: -1 }).lean();
  console.log('dbHealth.current=', dbHealth.current);
  console.log('dbHealth.temperature=', dbHealth.temperature);
  console.log('dbHealth.rms=', dbHealth.rms);
  console.log('dbHealth.peak=', dbHealth.peak);

  await mongoose.disconnect();
})();
