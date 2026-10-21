import mongoose, { Schema, Document, Types } from 'mongoose';
import { ToxicityLevel, PlantPart, IGrowingConditions, IPlantImage, ImageType } from '../../types';

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
  // Searchable aliases: common alternate names, local names, synonyms
  aliases: string[];
  // Plant classification type (herb, shrub, tree, climber, etc.)
  plantType: string | null;
  regionNative: string[];
  growingConditions: IGrowingConditions;
  images: IPlantImage[];
  model3dUrl: string | null;
  modelUrl: string | null;
  modelUrl_lod1: string | null;
  modelUrl_lod2: string | null;
  placement3d: {
    position: { x: number; y: number; z: number };
    scale: number;
  } | null;
  globalPosition3D: { x: number; y: number; z: number };
  botanicalBed: string;
  isVisibleInGarden: boolean;
  uploadedBy: Types.ObjectId | null;
  uploadedAt: Date | null;
  color: string;
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
    // unique declared here on the field; the schema.index() call below is removed to avoid duplicate
    scientificName: { type: String, required: true, unique: true, trim: true },
    // unique declared here on the field; the schema.index() call below is removed to avoid duplicate
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
    // Aliases: searchable alternate names, local names, synonyms
    aliases: [{ type: String }],
    // Plant type classification (herb, shrub, tree, climber, grass, etc.)
    plantType: { type: String, default: null },
    regionNative: [{ type: String }],
    growingConditions: { type: GrowingConditionsSchema, default: {} },
    images: [PlantImageSchema],
    model3dUrl: { type: String, default: null },
    modelUrl: { type: String, default: null },
    modelUrl_lod1: { type: String, default: null },
    modelUrl_lod2: { type: String, default: null },
    placement3d: {
      type: {
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
          z: { type: Number, required: true },
        },
        scale: { type: Number, required: true },
      },
      default: null,
    },
    globalPosition3D: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      z: { type: Number, default: 0 },
    },
    botanicalBed: { type: String, default: 'Uncategorized' },
    isVisibleInGarden: { type: Boolean, default: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    uploadedAt: { type: Date, default: null },
    color: { type: String, default: '#2d7a3a' },
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

// Full-text search index with field weights for relevance
// scientificName + commonName + aliases weighted highest, then medicinalUses/tags
PlantSchema.index(
  {
    commonName: 'text',
    scientificName: 'text',
    aliases: 'text',
    medicinalUses: 'text',
    tags: 'text',
    ayurvedicNames: 'text',
  },
  {
    weights: {
      commonName: 20,
      scientificName: 20,
      aliases: 15,
      ayurvedicNames: 10,
      medicinalUses: 5,
      tags: 3,
    },
    name: 'plant_text_search',
  },
);

// Compound and simple indexes — declared ONLY here (not as unique:true above duplicated)
// NOTE: unique:true on the schema field definition already creates an index.
// Additional non-unique indexes below:
PlantSchema.index({ isPublished: 1, isFeatured: 1 });
PlantSchema.index({ isPublished: 1, isDeleted: 1 });
PlantSchema.index({ isDeleted: 1 });
PlantSchema.index({ tags: 1 });
PlantSchema.index({ regionNative: 1 });
PlantSchema.index({ plantType: 1 });
PlantSchema.index({ createdAt: -1 });

export default mongoose.model<IPlant>('Plant', PlantSchema);
