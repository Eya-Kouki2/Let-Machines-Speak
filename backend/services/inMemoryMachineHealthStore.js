const machines = new Map();
const healthRecords = [];

function createDocument(data) {
  return {
    ...data,
    createdAt: data.createdAt || new Date(),
    updatedAt: new Date(),
  };
}

async function upsertMachine(machineId, data) {
  const existing = machines.get(machineId);
  const machine = createDocument({
    ...(existing || {}),
    ...data,
    machineId,
    createdAt: existing?.createdAt || new Date(),
  });

  machines.set(machineId, machine);
  return machine;
}

async function createHealthRecord(data) {
  const record = createDocument(data);
  healthRecords.push(record);
  return record;
}

async function findMachines() {
  return Array.from(machines.values()).sort((left, right) => left.machineId.localeCompare(right.machineId));
}

async function findMachine(machineId) {
  return machines.get(machineId) || null;
}

async function findLatestHealth(machineId) {
  return healthRecords
    .filter((record) => record.machineId === machineId)
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))[0] || null;
}

async function findHistory(machineId, query = {}) {
  const from = query.from ? new Date(query.from) : null;
  const to = query.to ? new Date(query.to) : null;
  const limit = Math.min(Number(query.limit) || 50, 200);

  return healthRecords
    .filter((record) => {
      const timestamp = new Date(record.timestamp);
      return record.machineId === machineId
        && (!from || timestamp >= from)
        && (!to || timestamp <= to);
    })
    .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
    .slice(0, limit);
}

function hasMachines() {
  return machines.size > 0;
}

module.exports = {
  createHealthRecord,
  findHistory,
  findLatestHealth,
  findMachine,
  findMachines,
  hasMachines,
  upsertMachine,
};
