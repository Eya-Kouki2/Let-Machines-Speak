const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const USER_ROLES = ['ADMIN', 'OPERATOR', 'VIEWER'];

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
    role: { type: String, enum: USER_ROLES, default: 'VIEWER', index: true },
    active: { type: Boolean, default: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    age: Number,
    yearsOfExperience: { type: Number, default: 0 },
    workZone: { type: String, default: 'Zone A' },
  },
  { timestamps: true }
);

userSchema.pre('validate', function setNameParts(next) {
  if (!this.name && (this.firstName || this.lastName)) {
    this.name = [this.firstName, this.lastName].filter(Boolean).join(' ');
  }
  if (!this.firstName && this.name) {
    const [firstName, ...rest] = this.name.split(' ');
    this.firstName = firstName;
    this.lastName = rest.join(' ');
  }
  next();
});

userSchema.pre('save', async function hashPassword(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
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
    firstName: this.firstName,
    lastName: this.lastName,
    workZone: this.workZone,
    yearsOfExperience: this.yearsOfExperience,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

module.exports = mongoose.model('User', userSchema);
module.exports.USER_ROLES = USER_ROLES;
