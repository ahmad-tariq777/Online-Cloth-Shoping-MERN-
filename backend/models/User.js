const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES } = require('../utils/constants');
const { EMAIL_REGEX } = require('../utils/validators');

const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MS = 15 * 60 * 1000;

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [EMAIL_REGEX, 'Please enter a valid email'],
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: Object.values(ROLES), default: ROLES.CUSTOMER },
    isActive: { type: Boolean, default: true },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
    lastLoginAt: { type: Date },
    passwordChangedAt: { type: Date },
    promotedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    promotedAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.statics.hashPassword = (password) => bcrypt.hash(password, 12);

userSchema.methods.comparePassword = function (password) {
  return this.password ? bcrypt.compare(password, this.password) : Promise.resolve(false);
};

userSchema.methods.incLoginAttempts = function () {
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({ $set: { loginAttempts: 1 }, $unset: { lockUntil: 1 } });
  }
  const updates = { $inc: { loginAttempts: 1 } };
  if (this.loginAttempts + 1 >= MAX_LOGIN_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME_MS };
  }
  return this.updateOne(updates);
};

userSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({ $set: { loginAttempts: 0 }, $unset: { lockUntil: 1 } });
};

userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  delete user.loginAttempts;
  delete user.lockUntil;
  delete user.passwordChangedAt;
  return user;
};

module.exports = mongoose.model('User', userSchema);
