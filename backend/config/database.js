const mongoose = require('mongoose');

async function connectDatabase() {
  const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;

  if (!mongoUri) {
    console.warn('MongoDB URI is not configured. Machine Health persistence is disabled.');
    return null;
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
  return mongoose.connection;
}

module.exports = {
  connectDatabase,
};
