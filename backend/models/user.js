const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['ADMIN', 'USER', 'OPERATOR', 'VIEWER'];
const APPROVAL_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Email format is invalid'],
      index: true,
    },
    password: { type: String, required: true, minlength: 8, select: false },
    role: { type: String, enum: USER_ROLES, default: 'USER', index: true },
    active: { type: Boolean, default: true, index: true },
    isApproved: { type: Boolean, default: true, index: true },
    approvalStatus: { type: String, enum: APPROVAL_STATUSES, default: 'APPROVED', index: true },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedAt: { type: Date, default: Date.now },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    age: { type: Number, min: 0, max: 120 },
    yearsOfExperience: { type: Number, default: 0, min: 0 },
    workZone: { type: String, default: 'Zone A', trim: true },
    profileImage: { type: String, default: null },
    mustChangePassword: { type: Boolean, default: false },
    temporaryPasswordIssuedAt: { type: Date, default: null },
    passwordChangedAt: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
    preferences: {
      type: Object,
      default: {
        theme: 'system',
        density: 'comfortable',
        reducedMotion: false,
        dashboardAnimations: true,
        liveDashboardUpdates: true,
      },
    },
    notifications: {
      type: Object,
      default: {
        machineAlerts: true,
        criticalMachineAlerts: true,
        safetyAlerts: true,
        emailNotifications: true,
        inAppNotifications: true,
        dailySummary: false,
      },
    },
    privacy: {
      type: Object,
      default: {
        showAccountEmail: true,
        liveDataRefresh: true,
      },
    },
  },
  { timestamps: true }
);

userSchema.pre('validate', function setNameParts() {
  if (this.role) {
    this.role = this.role.toUpperCase();
  }
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(' ');
  }
  if (!this.firstName && this.name) {
    const [firstName, ...rest] = this.name.split(' ');
    this.firstName = firstName;
    this.lastName = rest.join(' ');
  }
  if (!this.approvalStatus) {
    this.approvalStatus = 'APPROVED';
  }
  if (this.isApproved === undefined || this.isApproved === null) {
    this.isApproved = true;
  }
  if (this.approvalStatus === 'APPROVED' && !this.approvedAt) {
    this.approvedAt = new Date();
  }
});

userSchema.pre('save', async function hashPassword() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    active: this.active,
    isApproved: this.isApproved,
    approvalStatus: this.approvalStatus,
    approvedBy: this.approvedBy,
    approvedAt: this.approvedAt,
    firstName: this.firstName,
    lastName: this.lastName,
    age: this.age,
    workZone: this.workZone,
    yearsOfExperience: this.yearsOfExperience,
    profileImage: this.profileImage,
    mustChangePassword: this.mustChangePassword,
    temporaryPasswordIssuedAt: this.temporaryPasswordIssuedAt,
    passwordChangedAt: this.passwordChangedAt,
    lastLoginAt: this.lastLoginAt,
    preferences: this.preferences || {
      theme: 'system',
      density: 'comfortable',
      reducedMotion: false,
      dashboardAnimations: true,
      liveDashboardUpdates: true,
    },
    notifications: this.notifications || {
      machineAlerts: true,
      criticalMachineAlerts: true,
      safetyAlerts: true,
      emailNotifications: true,
      inAppNotifications: true,
      dailySummary: false,
    },
    privacy: this.privacy || {
      showAccountEmail: true,
      liveDataRefresh: true,
    },
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
module.exports.APPROVAL_STATUSES = APPROVAL_STATUSES;
