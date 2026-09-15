const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');
const SafetyEvent = require('../models/SafetyEvent');
const { emit } = require('./socketService');

// Ensure uploads/safety directory exists
const safetyUploadDir = path.join(__dirname, '..', 'uploads', 'safety');
try {
  fs.mkdirSync(safetyUploadDir, { recursive: true });
} catch (err) {
  console.warn('[safety] Warning initializing safety upload directory:', err.message);
}

/**
 * Saves base64 image data to the backend uploads/safety folder
 * @param {string} base64String - Base64 string or data URL
 * @param {string} [prefix] - Filename prefix (default: 'safety')
 * @returns {Promise<{ relativeUrl: string, absolutePath: string, filename: string } | null>}
 */
async function saveSafetyImage(base64String, prefix = 'safety') {
  if (!base64String || typeof base64String !== 'string') {
    return null;
  }

  let cleanBase64 = base64String.trim();
  let extension = 'jpg';

  if (cleanBase64.startsWith('data:image/')) {
    const matches = cleanBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
    if (matches) {
      extension = matches[1].toLowerCase() === 'jpeg' ? 'jpg' : matches[1].toLowerCase();
      cleanBase64 = matches[2];
    }
  }

  try {
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length === 0) {
      return null;
    }

    const filename = `${prefix}-${Date.now()}-${randomUUID().slice(0, 8)}.${extension}`;
    const absolutePath = path.join(safetyUploadDir, filename);

    await fs.promises.writeFile(absolutePath, buffer);

    return {
      relativeUrl: `/uploads/safety/${filename}`,
      absolutePath,
      filename,
    };
  } catch (error) {
    console.error('[safety] Failed to save safety image to disk:', error.message);
    return null;
  }
}

/**
 * Normalizes raw violation strings to a standard event identifier
 */
function normaliseSafetyViolationToEvent(violations) {
  const normalized = Array.isArray(violations)
    ? violations.map((v) => String(v).trim().toLowerCase())
    : [];

  if (normalized.some((v) => v.includes('fall'))) {
    return 'fall_detected';
  }
  if (normalized.some((v) => v.includes('hardhat') || v.includes('helmet'))) {
    return 'no_helmet';
  }
  if (normalized.some((v) => v.includes('zone') || v.includes('restricted'))) {
    return 'restricted_zone_entry';
  }
  if (normalized.length === 0) {
    return 'helmet_ok';
  }
  return 'unsafe_distance';
}

/**
 * Persists a safety event to MongoDB and stores any attached image in backend/uploads/safety
 * Emits real-time socket events to connected clients.
 */
async function persistSafetyEvent(rawPayload) {
  const timestampDate = rawPayload.timestamp
    ? typeof rawPayload.timestamp === 'number'
      ? new Date(rawPayload.timestamp * (rawPayload.timestamp < 1e11 ? 1000 : 1))
      : new Date(rawPayload.timestamp)
    : new Date();

  const violations = Array.isArray(rawPayload.violations)
    ? rawPayload.violations
    : typeof rawPayload.violations === 'string'
    ? [rawPayload.violations]
    : [];

  const eventType =
    rawPayload.event ||
    (violations.length > 0 ? normaliseSafetyViolationToEvent(violations) : 'no_helmet');

  const eventId =
    rawPayload.event_id ||
    rawPayload.eventId ||
    `safety-${timestampDate.getTime()}-${randomUUID().slice(0, 8)}`;

  let snapshotUrl = rawPayload.snapshot_url || '';
  let imagePath = rawPayload.image_path || '';

  // Process image data if provided as base64
  const rawBase64 = rawPayload.image_base64 || rawPayload.imageBase64 || (snapshotUrl.startsWith('data:') ? snapshotUrl : null);
  if (rawBase64) {
    const saved = await saveSafetyImage(rawBase64, 'safety');
    if (saved) {
      snapshotUrl = saved.relativeUrl;
      imagePath = saved.absolutePath;
    }
  }

  const eventDocData = {
    event_id: eventId,
    timestamp: timestampDate,
    node_id: rawPayload.node_id || rawPayload.nodeId || 'safety-cv-node',
    zone: rawPayload.zone || 'Zone 1',
    event: eventType,
    person_track_id: Number(rawPayload.person_track_id || rawPayload.personTrackId) || 1,
    confidence: typeof rawPayload.confidence === 'number' ? rawPayload.confidence : 1,
    status: rawPayload.status || 'open',
    violations,
    snapshot_url: snapshotUrl,
    image_path: imagePath,
  };

  let savedDoc = null;
  try {
    savedDoc = await SafetyEvent.create(eventDocData);
  } catch (dbErr) {
    console.error('[safety] Database save failed:', dbErr.message);
  }

  // Format JSON payload for Socket.IO clients and REST response
  const eventPayload = {
    _id: savedDoc ? String(savedDoc._id) : undefined,
    event_id: eventId,
    timestamp: timestampDate.toISOString(),
    node_id: eventDocData.node_id,
    zone: eventDocData.zone,
    event: eventDocData.event,
    person_track_id: eventDocData.person_track_id,
    confidence: eventDocData.confidence,
    status: eventDocData.status,
    violations: eventDocData.violations,
    snapshot_url: eventDocData.snapshot_url,
  };

  // Broadcast to frontend
  emit('safety:alert', { event: eventPayload });
  emit('safety:event', { event: eventPayload });
  emit('safety:updated', { event: eventPayload });
  emit('dashboard:updated');

  return eventPayload;
}

module.exports = {
  saveSafetyImage,
  normaliseSafetyViolationToEvent,
  persistSafetyEvent,
  safetyUploadDir,
};
