import mongoose, { Schema, Document, Types } from 'mongoose';
import { IDeviceInfo } from '../types';

export interface IRefreshToken extends Document {
  user: Types.ObjectId;
  tokenHash: string;
  deviceInfo: IDeviceInfo;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
}

const DeviceInfoSchema = new Schema<IDeviceInfo>(
  {
    ua: { type: String, required: true },
    ip: { type: String, required: true },
    device: String,
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
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL: auto-delete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ tokenHash: 1 }, { unique: true });

export default mongoose.model<IRefreshToken>('RefreshToken', RefreshTokenSchema);
