import mongoose, { Schema, Document, Types } from 'mongoose';
import { BookmarkEntityType } from '../types';

export interface IBookmark extends Document {
  user: Types.ObjectId;
  entityType: BookmarkEntityType;
  entityId: Types.ObjectId;
  collectionName: string | null;
  notes: string | null;
  createdAt: Date;
}

const BookmarkSchema = new Schema<IBookmark>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    entityType: {
      type: String,
      enum: Object.values(BookmarkEntityType),
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },
    collectionName: { type: String, default: null },
    notes: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Compound unique index: one bookmark per user per entity
BookmarkSchema.index({ user: 1, entityType: 1, entityId: 1 }, { unique: true });
BookmarkSchema.index({ user: 1 });

export default mongoose.model<IBookmark>('Bookmark', BookmarkSchema);
