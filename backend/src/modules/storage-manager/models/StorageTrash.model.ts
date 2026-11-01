import mongoose, { Schema, Document } from 'mongoose';
import { IStorageTrashDoc } from '../types';

export interface IStorageTrashModel extends IStorageTrashDoc, Document {}

const StorageTrashSchema = new Schema<IStorageTrashModel>(
  {
    originalKey: { type: String, required: true, index: true },
    trashKey: { type: String, required: true, unique: true, index: true },
    deletedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    deletedAt: { type: Date, default: Date.now, index: true },
    size: { type: Number, default: 0 },
    contentType: { type: String, default: 'application/octet-stream' },
    isReplacedOverwrite: { type: Boolean, default: false },
    dbRefsSnapshot: [
      {
        collection: { type: String, required: true },
        id: { type: String, required: true },
        field: { type: String, required: true },
      },
    ],
  },
  { timestamps: true, suppressReservedKeysWarning: true }
);

export const StorageTrash = mongoose.model<IStorageTrashModel>(
  'StorageTrash',
  StorageTrashSchema
);
export default StorageTrash;
