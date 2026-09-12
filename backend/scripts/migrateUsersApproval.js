const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const { connectDatabase } = require('../config/database');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateUsersApproval() {
  await connectDatabase();

  const seedAdminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@labes.local';
  const legacyUsers = await User.find({
    $or: [
      { isApproved: { $exists: false } },
      { approvalStatus: { $exists: false } },
    ],
  });

  for (const user of legacyUsers) {
    const shouldApprove = user.role !== 'ADMIN' || user.email === seedAdminEmail;
    user.isApproved = shouldApprove;
    user.approvalStatus = shouldApprove ? 'APPROVED' : 'PENDING';
    user.approvedAt = shouldApprove ? (user.approvedAt || new Date()) : null;
    await user.save();
    console.log(`${user.email}: ${user.approvalStatus}`);
  }

  console.log(`Migrated ${legacyUsers.length} users`);
}

migrateUsersApproval()
  .catch((error) => {
    console.error('User approval migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
