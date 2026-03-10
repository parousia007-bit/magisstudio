// ─── magis-studio/backend/src/models/User.model.js ───────────────────────────
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

// ─── Sub-schema: Download Record ──────────────────────────────────────────────
const downloadRecordSchema = new Schema({
  asset:        { type: Schema.Types.ObjectId, ref: 'DownloadAsset', required: true },
  downloadedAt: { type: Date, default: Date.now },
  ipAddress:    { type: String },
}, { _id: false });

// ─── Sub-schema: Avatar ───────────────────────────────────────────────────────
const avatarSchema = new Schema({
  url:       { type: String, default: null },
  publicId:  { type: String, default: null }, // Cloudinary public_id for deletion
}, { _id: false });

// ─── Main User Schema ─────────────────────────────────────────────────────────
const userSchema = new Schema(
  {
    // ── Identity ───────────────────────────────────────────────────────────────
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
      match: [/^[a-zA-Z0-9_.-]+$/, 'Username can only contain letters, numbers, dots, hyphens, and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never returned in queries by default
    },

    // ── Profile ────────────────────────────────────────────────────────────────
    displayName: {
      type: String,
      trim: true,
      maxlength: [60, 'Display name cannot exceed 60 characters'],
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
    },
    avatar: { type: avatarSchema, default: () => ({}) },
    location: { type: String, maxlength: [100] },
    website:  { type: String, maxlength: [200] },

    // ── Roles & Access ─────────────────────────────────────────────────────────
    role: {
      type: String,
      enum: {
        values: ['listener', 'contributor', 'editor', 'admin'],
        message: 'Invalid role: {VALUE}',
      },
      default: 'listener',
    },

    // Subscription tier controls download access & lossless streaming
    subscription: {
      tier: {
        type: String,
        enum: ['free', 'studio', 'mastering'],
        default: 'free',
      },
      expiresAt: { type: Date, default: null },
      stripeCustomerId: { type: String, select: false },
    },

    // ── Activity ───────────────────────────────────────────────────────────────
    downloads: [downloadRecordSchema],
    bookmarkedGear: [{ type: Schema.Types.ObjectId, ref: 'GearItem' }],
    likedTracks:    [{ type: Schema.Types.ObjectId, ref: 'AudioTrack' }],

    // ── Auth & Security ────────────────────────────────────────────────────────
    isEmailVerified:       { type: Boolean, default: false },
    emailVerificationToken: { type: String, select: false },
    passwordResetToken:    { type: String, select: false },
    passwordResetExpires:  { type: Date, select: false },
    refreshToken:          { type: String, select: false },
    lastLogin:             { type: Date },
    loginAttempts:         { type: Number, default: 0, select: false },
    lockUntil:             { type: Date, select: false },
    isActive:              { type: Boolean, default: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
userSchema.index({ email: 1 });
userSchema.index({ username: 1 });
userSchema.index({ role: 1 });
userSchema.index({ 'subscription.tier': 1 });
userSchema.index({ createdAt: -1 });

// ─── Virtuals ─────────────────────────────────────────────────────────────────
userSchema.virtual('isLocked').get(function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

userSchema.virtual('isSubscriptionActive').get(function () {
  if (this.subscription.tier === 'free') return true;
  return this.subscription.expiresAt && this.subscription.expiresAt > Date.now();
});

// ─── Pre-save Middleware ──────────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  // Only hash password if it was modified
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);

  // Set displayName default from username
  if (!this.displayName) {
    this.displayName = this.username;
  }

  next();
});

// ─── Instance Methods ─────────────────────────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.incrementLoginAttempts = async function () {
  const LOCK_TIME = 2 * 60 * 60 * 1000; // 2 hours
  const MAX_ATTEMPTS = 5;

  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 },
    });
  }

  const updates = { $inc: { loginAttempts: 1 } };

  if (this.loginAttempts + 1 >= MAX_ATTEMPTS && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + LOCK_TIME };
  }

  return this.updateOne(updates);
};

userSchema.methods.canDownload = function (assetId) {
  const alreadyDownloaded = this.downloads.some(
    (d) => d.asset.toString() === assetId.toString()
  );
  return !alreadyDownloaded;
};

// ─── Static Methods ───────────────────────────────────────────────────────────
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase().trim() });
};

const User = model('User', userSchema);

export default User;
