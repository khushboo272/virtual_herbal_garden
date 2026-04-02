import mongoose, { Schema, Document, Types } from 'mongoose';
import { DetectionStatus, IPrediction, IDetectionFeedback } from '../types';

export interface IDetection extends Document {
  user: Types.ObjectId;
  imageUrl: string;
  imageThumbnailUrl: string | null;
  status: DetectionStatus;
  predictions: IPrediction[];
  topMatch: Types.ObjectId | null;
  modelVersion: string;
  processingTimeMs: number | null;
  feedback: IDetectionFeedback | null;
  errorMessage: string | null;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PredictionSchema = new Schema<IPrediction>(
  {
    plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
    confidence: { type: Number, required: true },
    rank: { type: Number, required: true },
    commonName: { type: String, required: true },
  },
  { _id: false },
);

const FeedbackSchema = new Schema<IDetectionFeedback>(
  {
    reviewer: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    isCorrect: { type: Boolean, required: true },
    correctPlant: { type: Schema.Types.ObjectId, ref: 'Plant' },
    notes: String,
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const DetectionSchema = new Schema<IDetection>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    imageUrl: { type: String, required: true },
    imageThumbnailUrl: { type: String, default: null },
    status: {
      type: String,
      enum: Object.values(DetectionStatus),
      default: DetectionStatus.PENDING,
    },
    predictions: [PredictionSchema],
    topMatch: { type: Schema.Types.ObjectId, ref: 'Plant', default: null },
    modelVersion: { type: String, required: true },
    processingTimeMs: { type: Number, default: null },
    feedback: { type: FeedbackSchema, default: null },
    errorMessage: { type: String, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Indexes per PRD §4.6
DetectionSchema.index({ user: 1, createdAt: -1 });
DetectionSchema.index({ status: 1 });
DetectionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL auto-delete
DetectionSchema.index({ topMatch: 1 });

export default mongoose.model<IDetection>('Detection', DetectionSchema);
