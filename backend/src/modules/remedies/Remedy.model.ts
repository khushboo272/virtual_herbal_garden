import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  DifficultyLevel,
  PlantPart,
  IIngredient,
  IPreparationStep,
  IRemedyImage,
} from '../../types';

export interface IRemedy extends Document {
  title: string;
  slug: string;
  description: string;
  plants: Types.ObjectId[];
  ingredients: IIngredient[];
  preparationSteps: IPreparationStep[];
  dosage: string;
  contraindications: string[];
  precautions?: string[];
  difficultyLevel: DifficultyLevel;
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  preparationTime: number;
  prepTimeMinutes?: number;
  usage?: 'INTERNAL' | 'TOPICAL' | 'INHALATION';
  traditionalSource?: string;
  image?: string;
  images: IRemedyImage[];
  tags: string[];
  isPublished: boolean;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const IngredientSchema = new Schema<IIngredient>(
  {
    plantId: { type: Schema.Types.ObjectId, ref: 'Plant' },
    name: { type: String },
    partUsed: { type: String, enum: Object.values(PlantPart) },
    quantity: { type: String, required: true },
    unit: { type: String },
    notes: String,
  },
  { _id: false },
);

const PreparationStepSchema = new Schema<IPreparationStep>(
  {
    step: { type: Number, required: true },
    instruction: { type: String, required: true },
    durationMinutes: Number,
    imageUrl: String,
  },
  { _id: false },
);

const RemedyImageSchema = new Schema<IRemedyImage>(
  {
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false },
  },
  { _id: false },
);

const RemedySchema = new Schema<IRemedy>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, lowercase: true },
    description: { type: String, required: true },
    plants: [{ type: Schema.Types.ObjectId, ref: 'Plant' }],
    ingredients: [IngredientSchema],
    preparationSteps: [PreparationStepSchema],
    dosage: { type: String, required: true },
    contraindications: [{ type: String }],
    precautions: [{ type: String }],
    difficultyLevel: {
      type: String,
      enum: Object.values(DifficultyLevel),
      default: DifficultyLevel.EASY,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD', 'ADVANCED'],
      default: 'EASY',
    },
    preparationTime: { type: Number, required: true },
    prepTimeMinutes: { type: Number },
    usage: {
      type: String,
      enum: ['INTERNAL', 'TOPICAL', 'INHALATION'],
      default: 'INTERNAL',
    },
    traditionalSource: { type: String },
    image: { type: String },
    images: [RemedyImageSchema],
    tags: [{ type: String, lowercase: true }],
    isPublished: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true },
);

// Indexes declared once to prevent duplicate index warnings
RemedySchema.index({ slug: 1 }, { unique: true });
RemedySchema.index({ plants: 1 });
RemedySchema.index({ tags: 1 });
RemedySchema.index({ isPublished: 1, isDeleted: 1 });

export default mongoose.model<IRemedy>('Remedy', RemedySchema);
