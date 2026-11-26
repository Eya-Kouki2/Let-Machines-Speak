const Alert = require('../models/alert');
const { emit } = require('./socketService');

const ALERT_DEDUPE_WINDOW_MS = 15 * 60 * 1000;
const DEDUPE_TYPES = new Set([
  'MACHINE_WARNING',
  'MACHINE_CRITICAL',
  'NO_HELMET',
  'RESTRICTED_ZONE_ENTRY',
  'ZONE_WARNING',
  'SAFETY_VIOLATION',
]);

function buildAlertPayload({
  type,
  category,
  severity = 'INFO',
  title,
  message,
  sourceType = category,
  sourceId = '',
  userId = null,
  visibleTo = 'ALL',
  createdBy = null,
  metadata = {},
}) {
  return {
    type,
    category,
    severity,
    title,
    message,
    sourceType,
    sourceId,
    userId,
    visibleTo,
    createdBy,
    metadata,
  };
}

async function createAlert(params) {
  const payload = buildAlertPayload(params);

  if (DEDUPE_TYPES.has(payload.type) && payload.sourceId) {
    const duplicateWindow = new Date(Date.now() - ALERT_DEDUPE_WINDOW_MS);
    const duplicate = await Alert.findOne({
      type: payload.type,
      sourceId: payload.sourceId,
      sourceType: payload.sourceType,
      createdAt: { $gte: duplicateWindow },
    }).sort({ createdAt: -1 }).lean();

    if (duplicate) {
      return null;
    }
  }

  const alert = await Alert.create(payload);
  emit('alert:created', { alert });
  emit('dashboard:updated');
  return alert;
}

module.exports = {
  createAlert,
  buildAlertPayload,
};
