import mongoose, { Schema, Document, Types } from 'mongoose';
import { AuditAction } from '../types';

export interface IAuditLog extends Document {
  user: Types.ObjectId;
  action: AuditAction;
  entityType: string;
  entityId: Types.ObjectId | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: Object.values(AuditAction),
      required: true,
    },
    entityType: { type: String, required: true },
    entityId: { type: Schema.Types.ObjectId, default: null },
    oldValue: { type: Schema.Types.Mixed, default: null },
    newValue: { type: Schema.Types.Mixed, default: null },
    ipAddress: { type: String, required: true },
    userAgent: { type: String, required: true },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 12 months
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL: auto-delete after 12 months
AuditLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
AuditLogSchema.index({ user: 1 });
AuditLogSchema.index({ action: 1 });
AuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
