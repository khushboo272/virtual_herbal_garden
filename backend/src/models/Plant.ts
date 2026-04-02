import mongoose, { Schema, Document, Types } from 'mongoose';
import { ToxicityLevel, PlantPart, IGrowingConditions, IPlantImage, ImageType } from '../types';

export interface IPlant extends Document {
  commonName: string;
  scientificName: string;
  slug: string;
  family: string;
  description: string;
  shortDescription: string | null;
  medicinalUses: string[];
  partsUsed: PlantPart[];
  toxicityLevel: ToxicityLevel;
  ayurvedicNames: string[];
  regionNative: string[];
  growingConditions: IGrowingConditions;
  images: IPlantImage[];
  model3dUrl: string | null;
  categories: Types.ObjectId[];
  tags: string[];
  attributes: Map<string, unknown>;
  isPublished: boolean;
  isFeatured: boolean;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const GrowingConditionsSchema = new Schema<IGrowingConditions>(
  {
    soil: String,
    water: String,
    sunlight: String,
    climate: String,
    hardinessZone: String,
  },
  { _id: false },
);

const PlantImageSchema = new Schema<IPlantImage>(
  {
    url: { type: String, required: true },
    alt: String,
    isPrimary: { type: Boolean, default: false },
    type: { type: String, enum: Object.values(ImageType) },
    width: Number,
    height: Number,
    thumbnailUrl: String,
    cardUrl: String,
    fullUrl: String,
    lqip: String,
  },
  { _id: false },
);

const PlantSchema = new Schema<IPlant>(
  {
    commonName: { type: String, required: true, trim: true },
    scientificName: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    family: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500, default: null },
    medicinalUses: [{ type: String }],
    partsUsed: [{ type: String, enum: Object.values(PlantPart) }],
    toxicityLevel: {
      type: String,
      enum: Object.values(ToxicityLevel),
      required: true,
      default: ToxicityLevel.NONE,
    },
    ayurvedicNames: [{ type: String }],
    regionNative: [{ type: String }],
    growingConditions: { type: GrowingConditionsSchema, default: {} },
    images: [PlantImageSchema],
    model3dUrl: { type: String, default: null },
    categories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
    tags: [{ type: String, lowercase: true }],
    attributes: { type: Map, of: Schema.Types.Mixed },
    isPublished: { type: Boolean, default: false },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// Indexes per PRD
PlantSchema.index({ slug: 1 }, { unique: true });
PlantSchema.index({ scientificName: 1 }, { unique: true });
PlantSchema.index({ isPublished: 1, isFeatured: 1 });
PlantSchema.index({ tags: 1 });
PlantSchema.index({ isDeleted: 1 });

export default mongoose.model<IPlant>('Plant', PlantSchema);
