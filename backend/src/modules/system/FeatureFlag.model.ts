import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../../types';

export type FeatureFlagCategory = 'EXPERIENCE' | 'AI' | 'COMMUNITY' | 'SYSTEM' | 'EXPERIMENTAL';

export interface IFeatureFlag extends Document {
  key: string;
  name: string;
  description: string;
  category: FeatureFlagCategory;
  isEnabled: boolean;
  rolloutPercentage: number;
  minimumRole: UserRole;
  isSystem: boolean;
  tags: string[];
  metadata?: Record<string, any>;
  updatedBy?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}

const FeatureFlagSchema = new Schema<IFeatureFlag>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: String,
      enum: ['EXPERIENCE', 'AI', 'COMMUNITY', 'SYSTEM', 'EXPERIMENTAL'],
      default: 'EXPERIENCE',
      index: true,
    },
    isEnabled: {
      type: Boolean,
      default: false,
      index: true,
    },
    rolloutPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },
    minimumRole: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
      index: true,
    },
    isSystem: {
      type: Boolean,
      default: false,
    },
    tags: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const FeatureFlag = mongoose.model<IFeatureFlag>('FeatureFlag', FeatureFlagSchema);

export default FeatureFlag;
