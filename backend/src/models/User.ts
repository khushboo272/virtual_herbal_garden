import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, IOAuthAccount } from '../types';

export interface IUser extends Document {
  email: string;
  passwordHash: string | null;
  role: UserRole;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  isEmailVerified: boolean;
  is2faEnabled: boolean;
  totpSecret: string | null;
  isActive: boolean;
  banReason: string | null;
  oauthAccounts: IOAuthAccount[];
  loginAttempts: number;
  lockUntil: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isLocked(): boolean;
  incrementLoginAttempts(): Promise<void>;
  resetLoginAttempts(): Promise<void>;
}

const OAuthAccountSchema = new Schema<IOAuthAccount>(
  {
    provider: { type: String, required: true },
    providerUserId: { type: String, required: true },
    accessToken: { type: String, default: '' },
  },
  { _id: false },
);

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, default: null },
    role: {
      type: String,
      enum: Object.values(UserRole),
      required: true,
      default: UserRole.USER,
    },
    displayName: { type: String, required: true, trim: true },
    avatarUrl: { type: String, default: null },
    bio: { type: String, maxlength: 500, default: null },
    isEmailVerified: { type: Boolean, default: false },
    is2faEnabled: { type: Boolean, default: false },
    totpSecret: { type: String, default: null },
    isActive: { type: Boolean, default: true },
    banReason: { type: String, default: null },
    oauthAccounts: [OAuthAccountSchema],
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date, default: null },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true },
);

// Indexes
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ role: 1 });
UserSchema.index({ createdAt: -1 });

// Methods
UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

UserSchema.methods.incrementLoginAttempts = async function (): Promise<void> {
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 15 * 60 * 1000; // 15 minutes

  if (this.lockUntil && this.lockUntil < new Date()) {
    // Previous lock has expired, reset
    this.loginAttempts = 1;
    this.lockUntil = null;
  } else {
    this.loginAttempts += 1;
    if (this.loginAttempts >= MAX_ATTEMPTS) {
      this.lockUntil = new Date(Date.now() + LOCK_TIME);
    }
  }
  await this.save();
};

UserSchema.methods.resetLoginAttempts = async function (): Promise<void> {
  this.loginAttempts = 0;
  this.lockUntil = null;
  await this.save();
};

// Never return sensitive fields in JSON
UserSchema.set('toJSON', {
  transform(_doc, ret) {
    delete (ret as any).passwordHash;
    delete (ret as any).totpSecret;
    delete (ret as any).__v;
    return ret;
  },
});

export default mongoose.model<IUser>('User', UserSchema);
