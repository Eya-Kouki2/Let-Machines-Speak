const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');
const { connectDatabase } = require('../config/database');
const User = require('../models/user');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function migrateUsersApproval() {
  await connectDatabase();

  const allUsers = await User.find({});

  for (const user of allUsers) {
    if (user.role) user.role = user.role.toUpperCase();
    user.isApproved = true;
    user.approvalStatus = 'APPROVED';
    user.active = true;
    user.mustChangePassword = false;
    user.approvedAt = user.approvedAt || new Date();
    await user.save();
    console.log(`${user.email}: ${user.role} (${user.approvalStatus})`);
  }

  console.log(`Migrated and approved ${allUsers.length} users`);
}

migrateUsersApproval()
  .catch((error) => {
    console.error('User approval migration failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
