const Machine = require('../models/machine');
const HealthRecord = require('../models/HealthRecord');
const SafetyEvent = require('../models/SafetyEvent');
const Alert = require('../models/alert');
const mongoose = require('mongoose');

function useRealDb() {
  return mongoose.connection.readyState === 1;
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/summary
// ---------------------------------------------------------------------------
async function getSummary(req, res, next) {
  try {
    if (!useRealDb()) {
      // Fallback when DB is not connected (e.g. dev without Mongo)
      return res.json({
        success: true,
        data: {
          machines: { total: 0, healthy: 0, warning: 0, critical: 0, offline: 0, averageHealthScore: null },
          safety: { zones: 0, safeZones: 0, activeViolations: 0, eventsToday: 0 },
          alerts: { active: 0, critical: 0, today: 0 },
        },
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [machines, healthRecords, safetyEventsToday, activeAlerts, alertsToday] = await Promise.all([
      Machine.find({}, { machineId: 1, name: 1, status: 1, zone: 1 }).lean(),
      // Latest health record per machine (status: green/yellow/red)
      HealthRecord.aggregate([
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$machineId',
            latestScore: { $first: '$healthScore' },
            latestStatus: { $first: '$status' },
          },
        },
      ]),
      SafetyEvent.countDocuments({ timestamp: { $gte: todayStart } }),
      SafetyEvent.countDocuments({ status: 'open' }),
      Alert.countDocuments({ createdAt: { $gte: todayStart } }),
      SafetyEvent.aggregate([
        { $match: { timestamp: { $gte: todayStart } } },
        { $group: { _id: '$event', count: { $sum: 1 } } },
      ]),
    ]);

    const safetyByType = safetyEventsByType || [];
    const eventTypeCounts = {
      no_helmet: 0,
      restricted_zone_entry: 0,
      fall_detected: 0,
      unsafe_distance: 0,
    };
    for (const item of safetyByType) {
      if (item._id && item._id in eventTypeCounts) {
        eventTypeCounts[item._id] = item.count;
      }
    }

    // Machine status distribution
    const machineStatusMap = {};
    for (const m of machines) {
      machineStatusMap[m.machineId] = m.status; // ONLINE/WARNING/CRITICAL/OFFLINE
    }

    let healthy = 0;
    let warning = 0;
    let critical = 0;
    let totalScore = 0;
    let scoredCount = 0;

    for (const rec of healthRecords) {
      if (rec.latestStatus === 'green') healthy++;
      else if (rec.latestStatus === 'yellow') warning++;
      else if (rec.latestStatus === 'red') critical++;

      if (typeof rec.latestScore === 'number') {
        totalScore += rec.latestScore;
        scoredCount++;
      }
    }

    // Machines with no health records yet are counted from machine statuses
    const machinedWithRecords = new Set(healthRecords.map((r) => r._id));
    for (const m of machines) {
      if (!machinedWithRecords.has(m.machineId)) {
        if (m.status === 'ONLINE') healthy++;
        else if (m.status === 'WARNING') warning++;
        else if (m.status === 'CRITICAL') critical++;
        // OFFLINE → not counted in health tiers
      }
    }

    const averageHealthScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : null;

    // Attention machines: WARNING or CRITICAL or lowest health scores
    const attentionMachines = machines
      .filter((m) => m.status === 'CRITICAL' || m.status === 'WARNING')
      .map((m) => {
        const rec = healthRecords.find((r) => r._id === m.machineId);
        return {
          machineId: m.machineId,
          name: m.name || m.machineId,
          zone: m.zone,
          status: m.status,
          healthScore: typeof rec?.latestScore === 'number' ? rec.latestScore : null,
        };
      })
      .slice(0, 5);

    // Safety zones (unique zones from SafetyEvent or Machine)
    const safetyZones = [...new Set(machines.map((m) => m.zone).filter(Boolean))];
    const zonesWithActiveViolations = await SafetyEvent.distinct('zone', { status: 'open' });
    const activeViolations = zonesWithActiveViolations.length;
    const safeZones = Math.max(0, safetyZones.length - activeViolations);

    // Active alerts
    const criticalAlerts = await Alert.countDocuments({ active: true, severity: 'CRITICAL' });
    const totalActiveAlerts = await Alert.countDocuments({ active: true });

    return res.json({
      success: true,
      data: {
        machines: {
          total: machines.length,
          healthy,
          warning,
          critical,
          offline: machines.filter((m) => m.status === 'OFFLINE').length,
          averageHealthScore,
          attentionMachines,
        },
        safety: {
          zones: safetyZones.length,
          safeZones,
          activeViolations,
          eventsToday: safetyEventsToday,
          byType: eventTypeCounts,
        },
        alerts: {
          active: totalActiveAlerts,
          critical: criticalAlerts,
          today: alertsToday,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/recent-activity
// ---------------------------------------------------------------------------
async function getRecentActivity(req, res, next) {
  try {
    if (!useRealDb()) {
      return res.json({ success: true, data: [] });
    }

    const limit = Math.min(Number(req.query.limit) || 10, 50);

    const [recentAlerts, recentSafetyEvents] = await Promise.all([
      Alert.find({})
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      SafetyEvent.find({})
        .sort({ timestamp: -1 })
        .limit(limit)
        .lean(),
    ]);

    const items = [];

    for (const alert of recentAlerts) {
      items.push({
        type: alert.source === 'WORKER_SAFETY' ? 'SAFETY_EVENT' : 'MACHINE_ALERT',
        severity: alert.severity,
        title: alert.message,
        source: alert.machineId || alert.zone || 'System',
        timestamp: alert.createdAt,
      });
    }

    for (const event of recentSafetyEvents) {
      const titleMap = {
        no_helmet: 'No helmet detected',
        restricted_zone_entry: 'Restricted zone entry',
        fall_detected: 'Fall detected',
        unsafe_distance: 'Unsafe distance',
      };
      items.push({
        type: 'SAFETY_EVENT',
        severity: event.status === 'open' ? 'WARNING' : 'INFO',
        title: titleMap[event.event] || event.event,
        source: event.zone,
        timestamp: event.timestamp,
      });
    }

    // Sort by timestamp descending and take top N
    items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return res.json({ success: true, data: items.slice(0, limit) });
  } catch (error) {
    return next(error);
  }
}

// ---------------------------------------------------------------------------
// GET /api/dashboard/health-trend
// Returns average health score grouped by hour for the last 24h
// ---------------------------------------------------------------------------
async function getHealthTrend(req, res, next) {
  try {
    if (!useRealDb()) {
      return res.json({ success: true, data: [] });
    }

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const trend = await HealthRecord.aggregate([
      { $match: { timestamp: { $gte: since } } },
      {
        $group: {
          _id: {
            hour: { $hour: '$timestamp' },
            day: { $dayOfMonth: '$timestamp' },
          },
          avgScore: { $avg: '$healthScore' },
          count: { $sum: 1 },
          timestamp: { $first: '$timestamp' },
        },
      },
      { $sort: { timestamp: 1 } },
      {
        $project: {
          _id: 0,
          timestamp: 1,
          avgScore: { $round: ['$avgScore', 1] },
          count: 1,
        },
      },
    ]);

    return res.json({ success: true, data: trend });
  } catch (error) {
    return next(error);
  }
}

module.exports = { getSummary, getRecentActivity, getHealthTrend };
