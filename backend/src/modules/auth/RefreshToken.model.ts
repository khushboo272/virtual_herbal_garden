import mongoose, { Schema, Document, Types } from 'mongoose';
import { IDeviceInfo } from '../../types';

export interface IRefreshToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  deviceInfo: IDeviceInfo;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date;
  createdAt: Date;
}

const DeviceInfoSchema = new Schema<IDeviceInfo>(
  {
    ua: { type: String, required: true },
    ip: { type: String, required: true },
    device: { type: String, default: 'Unknown Device' },
  },
  { _id: false },
);

const RefreshTokenSchema = new Schema<IRefreshToken>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    deviceInfo: { type: DeviceInfoSchema, required: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    lastUsedAt: { type: Date, default: () => new Date() },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL: auto-delete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
