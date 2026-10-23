import mongoose, { Schema, Document, Types } from 'mongoose';
import { ITourStop, MediaType, ITourCheckpoint, TourLevel } from '../../types';

export interface ITour extends Document {
  slug: string;
  title: string;
  summary?: string;
  description: string;
  difficulty: string;
  level?: TourLevel;
  healthCategory?: string;
  tags?: string[];
  estimatedDuration: number;
  estimatedMinutes?: number;
  coverImage?: string;
  coverImageUrl: string | null;
  sequential?: boolean;
  isPublished: boolean;
  isFeatured?: boolean;
  sortOrder?: number;
  checkpoints?: ITourCheckpoint[];
  stops: ITourStop[];
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const QuizQuestionSchema = new Schema(
  {
    prompt: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIndex: { type: Number, required: true },
    explanation: { type: String, default: '' },
  },
  { _id: false },
);

const CheckpointSchema = new Schema(
  {
    key: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    summary: { type: String, default: '' },
    body: { type: String, default: '' },
    durationMinutes: { type: Number, default: 3 },
    plantSlugs: [{ type: String }],
    remedySlugs: [{ type: String }],
    keyTakeaways: [{ type: String }],
    audioUrl: { type: String },
    quiz: {
      passScore: { type: Number, default: 0.6 },
      questions: [QuizQuestionSchema],
    },
  },
  { _id: false },
);

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
    slug: { type: String, lowercase: true, required: true },
    title: { type: String, required: true, trim: true },
    summary: { type: String },
    description: { type: String, default: '' },
    difficulty: { type: String, default: 'EASY' },
    level: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    healthCategory: { type: String, index: true },
    tags: [{ type: String, lowercase: true }],
    estimatedDuration: { type: Number, default: 10 },
    estimatedMinutes: { type: Number },
    coverImage: { type: String },
    coverImageUrl: { type: String, default: null },
    sequential: { type: Boolean, default: true },
    checkpoints: [CheckpointSchema],
    stops: [TourStopSchema],
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Indexes declared once to prevent duplicate index warnings
TourSchema.index({ slug: 1 }, { unique: true });
TourSchema.index({ isPublished: 1, isDeleted: 1 });
TourSchema.index({ isFeatured: 1 });
TourSchema.index({ sortOrder: 1 });

export default mongoose.model<ITour>('Tour', TourSchema);

