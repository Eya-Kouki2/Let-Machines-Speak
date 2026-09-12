const Machine = require('../models/machine');

exports.listMachines = async (req, res, next) => {
  try {
    const machines = await Machine.find().sort({ machineId: 1 });
    return res.json({ success: true, data: machines });
  } catch (error) {
    return next(error);
  }
};

exports.getMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findOne({ machineId: req.params.id });
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
    return res.json({ success: true, data: machine });
  } catch (error) {
    return next(error);
  }
};

exports.createMachine = async (req, res, next) => {
  try {
    const machine = await Machine.create(req.body);
    return res.status(201).json({ success: true, data: machine });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Machine ID already exists' });
    return next(error);
  }
};

exports.updateMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findOneAndUpdate({ machineId: req.params.id }, req.body, { new: true, runValidators: true });
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
    return res.json({ success: true, data: machine });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: 'Machine ID already exists' });
    return next(error);
  }
};

exports.deleteMachine = async (req, res, next) => {
  try {
    const machine = await Machine.findOneAndDelete({ machineId: req.params.id });
    if (!machine) return res.status(404).json({ success: false, message: 'Machine not found' });
    return res.json({ success: true, data: machine });
  } catch (error) {
    return next(error);
  }
};
