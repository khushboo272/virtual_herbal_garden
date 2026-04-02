import mongoose, { Schema, Document, Types } from 'mongoose';
import { ActivityType } from '../types';

export interface IActivityLog extends Document {
  user: Types.ObjectId;
  activityType: ActivityType;
  entityId: Types.ObjectId | null;
  metadata: Record<string, unknown>;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    activityType: {
      type: String,
      enum: Object.values(ActivityType),
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, default: null },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivityLogSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
