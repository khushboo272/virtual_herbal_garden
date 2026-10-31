import mongoose, { Schema, Document, Types } from 'mongoose';
import { DbBackupKind } from '../types';

export interface IDbBackup extends Document {
  r2Key: string;
  filename: string;
  size: number;
  collections: string[];
  docCounts: Record<string, number>;
  checksum: string; // SHA-256
  createdBy: Types.ObjectId;
  note?: string;
  kind: DbBackupKind;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DbBackupSchema = new Schema<IDbBackup>(
  {
    r2Key: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    size: { type: Number, required: true },
    collections: [{ type: String, required: true }],
    docCounts: { type: Schema.Types.Mixed, default: {} },
    checksum: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    note: { type: String, default: '' },
    kind: {
      type: String,
      required: true,
      enum: ['manual', 'scheduled', 'pre-restore', 'pre-import', 'pre-bulk'],
      default: 'manual',
      index: true,
    },
    isDeleted: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

DbBackupSchema.index({ createdAt: -1 });

export default mongoose.model<IDbBackup>('DbBackup', DbBackupSchema);

