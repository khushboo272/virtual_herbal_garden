import mongoose, { Schema, Types } from 'mongoose';
import { DbJobType, DbJobStatus, DbJobProgress, DbJobCounts, DbJobError } from '../types';

export interface IDbJob {
  _id: Types.ObjectId;
  type: DbJobType;
  status: DbJobStatus;
  progress: DbJobProgress;
  counts: DbJobCounts;
  errors: DbJobError[];
  batchId: string;
  collectionName?: string;
  meta: Record<string, any>;
  snapshotData?: any; // pre-image for undo operations
  isUndone: boolean;
  undoneAt?: Date;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DbJobSchema = new Schema<IDbJob>(
  {
    type: {
      type: String,
      required: true,
      enum: ['import', 'export', 'backup', 'restore', 'integrity', 'tool', 'bulk'],
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: ['queued', 'running', 'done', 'failed', 'cancelled'],
      default: 'queued',
      index: true,
    },
    progress: {
      current: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
      percent: { type: Number, default: 0 },
      message: { type: String, default: '' },
    },
    counts: {
      inserted: { type: Number, default: 0 },
      updated: { type: Number, default: 0 },
      skipped: { type: Number, default: 0 },
      deleted: { type: Number, default: 0 },
      errors: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    errors: [
      {
        row: { type: Number },
        collectionName: { type: String },
        slug: { type: String },
        field: { type: String },
        message: { type: String, required: true },
      },
    ],
    batchId: { type: String, required: true, index: true },
    collectionName: { type: String, index: true },
    meta: { type: Schema.Types.Mixed, default: {} },
    snapshotData: { type: Schema.Types.Mixed, default: null },
    isUndone: { type: Boolean, default: false },
    undoneAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

DbJobSchema.index({ createdAt: -1 });

export default mongoose.model<IDbJob>('DbJob', DbJobSchema);
