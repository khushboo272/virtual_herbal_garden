import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuizResultEntry {
  bestScore: number;
  total: number;
  attempts: number;
  passed: boolean;
  lastAt: Date;
}

export interface ITourProgress extends Document {
  userId: Types.ObjectId;
  tourId: Types.ObjectId;
  completedKeys: string[];
  quizResults: Map<string, IQuizResultEntry>;
  lastCheckpointKey?: string;
  startedAt: Date;
  completedAt?: Date;
  rating?: number;
  ratingComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TourProgressSchema = new Schema<ITourProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tourId: { type: Schema.Types.ObjectId, ref: 'Tour', required: true },
    completedKeys: [{ type: String }],
    quizResults: {
      type: Map,
      of: new Schema(
        {
          bestScore: { type: Number, required: true },
          total: { type: Number, required: true },
          attempts: { type: Number, default: 1 },
          passed: { type: Boolean, required: true },
          lastAt: { type: Date, default: Date.now },
        },
        { _id: false },
      ),
      default: () => new Map(),
    },
    lastCheckpointKey: { type: String },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    rating: { type: Number, min: 1, max: 5 },
    ratingComment: { type: String, trim: true },
  },
  { timestamps: true },
);

// Single compound unique index
TourProgressSchema.index({ userId: 1, tourId: 1 }, { unique: true });
TourProgressSchema.index({ userId: 1, completedAt: 1 });
TourProgressSchema.index({ tourId: 1, completedAt: 1 });

export default mongoose.model<ITourProgress>('TourProgress', TourProgressSchema);
