import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITourStop, MediaType } from '../types';

export interface ITour extends Document {
  slug: string;
  title: string;
  description: string;
  difficulty: string;
  estimatedDuration: number;
  coverImageUrl: string | null;
  stops: ITourStop[];
  isPublished: boolean;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TourStopSchema = new Schema(
  {
    order: { type: Number, required: true },
    plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    mediaUrl: String,
    mediaType: { type: String, enum: Object.values(MediaType) },
    coordinates3d: {
      type: { x: Number, y: Number, z: Number },
      default: undefined,
    },
  },
  { _id: false },
);

const TourSchema = new Schema<ITour>(
  {
    slug: { type: String, unique: true, lowercase: true, required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    difficulty: { type: String, default: 'EASY' },
    estimatedDuration: { type: Number, required: true },
    coverImageUrl: { type: String, default: null },
    stops: [TourStopSchema],
    isPublished: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

TourSchema.index({ slug: 1 }, { unique: true });
TourSchema.index({ isPublished: 1 });

export default mongoose.model<ITour>('Tour', TourSchema);
