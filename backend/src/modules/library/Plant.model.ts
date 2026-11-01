import mongoose, { Schema, Document, Types } from 'mongoose';
import { ToxicityLevel, PlantPart, IGrowingConditions, IPlantImage, ImageType, ContentStatus, IReviewNote } from '../../types';

export enum PlantHabit {
  HERB = 'HERB',
  SHRUB = 'SHRUB',
  TREE = 'TREE',
  GRASS = 'GRASS',
  CLIMBER = 'CLIMBER',
  SUCCULENT = 'SUCCULENT',
  ROOT = 'ROOT',
}

export enum LeafShape {
  LANCEOLATE = 'LANCEOLATE',
  OVATE = 'OVATE',
  HEART = 'HEART',
  PINNATE = 'PINNATE',
  SPIKY = 'SPIKY',
  ROUND = 'ROUND',
}

export enum ModelStatus {
  NONE = 'NONE',
  READY = 'READY',
  FAILED = 'FAILED',
}

export interface IPlantVisual {
  habit?: PlantHabit;
  heightM?: number;
  spreadM?: number;
  foliageColor?: string;
  flowerColor?: string;
  leafShape?: LeafShape;
}

export interface IModelTransform {
  scale?: number;
  rotationY?: number;
  offsetY?: number;
  targetHeightM?: number;
}

export interface ILastModelError {
  at: Date;
  message: string;
}

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
  status: ContentStatus;
  owner: Types.ObjectId;
  isFeatured: boolean;
  isDeleted: boolean;
  createdBy: Types.ObjectId;
  reviewNotes: IReviewNote[];
  submittedAt: Date | null;
  references: string[];
  precautions: string[];
  keyBenefits: string[];
  avgRating: number;
  reviewCount: number;
  viewCount: number;
  // 3D Appearance and Model Pipeline fields
  visual?: IPlantVisual;
  modelVersion?: number;
  modelStatus?: ModelStatus;
  modelTransform?: IModelTransform;
  lastModelError?: ILastModelError;
  createdAt: Date;
  updatedAt: Date;
}

export function deriveVisualDefaults(plant: {
  plantType?: string | null;
  commonName?: string;
  scientificName?: string;
  visual?: IPlantVisual;
}): Required<IPlantVisual> {
  const v = plant.visual || {};
  const typeStr = (plant.plantType || '').toLowerCase();
  const nameStr = `${plant.commonName || ''} ${plant.scientificName || ''}`.toLowerCase();

  let habit: PlantHabit = PlantHabit.HERB;
  let heightM = 0.5;
  let spreadM = 0.4;
  let leafShape: LeafShape = LeafShape.OVATE;

  if (typeStr === 'tree' || typeStr.includes('tree')) {
    habit = PlantHabit.TREE;
    heightM = 6.0;
    spreadM = 4.0;
    leafShape = LeafShape.PINNATE;
  } else if (typeStr === 'shrub' || typeStr.includes('shrub')) {
    habit = PlantHabit.SHRUB;
    heightM = 1.2;
    spreadM = 0.9;
    leafShape = LeafShape.OVATE;
  } else if (typeStr === 'herb' || typeStr.includes('herb')) {
    habit = PlantHabit.HERB;
    heightM = 0.5;
    spreadM = 0.4;
    leafShape = LeafShape.OVATE;
  } else if (typeStr === 'climber' || typeStr.includes('climber') || typeStr.includes('vine') || typeStr.includes('creeper')) {
    habit = PlantHabit.CLIMBER;
    heightM = 1.8;
    spreadM = 0.6;
    leafShape = LeafShape.HEART;
  } else if (typeStr === 'succulent' || typeStr.includes('succulent')) {
    habit = PlantHabit.SUCCULENT;
    heightM = 0.6;
    spreadM = 0.5;
    leafShape = LeafShape.SPIKY;
  } else if (typeStr === 'grass' || typeStr.includes('grass')) {
    habit = PlantHabit.GRASS;
    heightM = 0.8;
    spreadM = 0.5;
    leafShape = LeafShape.LANCEOLATE;
  } else if (typeStr === 'root' || typeStr.includes('root')) {
    habit = PlantHabit.ROOT;
    heightM = 0.7;
    spreadM = 0.5;
    leafShape = LeafShape.LANCEOLATE;
  } else if (
    nameStr.includes('neem') ||
    nameStr.includes('amla') ||
    nameStr.includes('arjuna') ||
    nameStr.includes('banyan') ||
    nameStr.includes('peepal')
  ) {
    habit = PlantHabit.TREE;
    heightM = 6.0;
    spreadM = 4.0;
    leafShape = LeafShape.PINNATE;
  } else if (
    nameStr.includes('ashwagandha') ||
    nameStr.includes('mulethi')
  ) {
    habit = PlantHabit.SHRUB;
    heightM = 1.2;
    spreadM = 0.9;
    leafShape = LeafShape.OVATE;
  } else if (
    nameStr.includes('giloy') ||
    nameStr.includes('shatavari')
  ) {
    habit = PlantHabit.CLIMBER;
    heightM = 1.8;
    spreadM = 0.6;
    leafShape = LeafShape.HEART;
  } else if (
    nameStr.includes('aloe') ||
    nameStr.includes('cactus')
  ) {
    habit = PlantHabit.SUCCULENT;
    heightM = 0.6;
    spreadM = 0.5;
    leafShape = LeafShape.SPIKY;
  } else if (
    nameStr.includes('lemongrass') ||
    nameStr.includes('vetiver')
  ) {
    habit = PlantHabit.GRASS;
    heightM = 0.8;
    spreadM = 0.5;
    leafShape = LeafShape.LANCEOLATE;
  } else if (
    nameStr.includes('turmeric') ||
    nameStr.includes('ginger')
  ) {
    habit = PlantHabit.ROOT;
    heightM = 0.7;
    spreadM = 0.5;
    leafShape = LeafShape.LANCEOLATE;
  }

  return {
    habit: v.habit || habit,
    heightM: v.heightM ?? heightM,
    spreadM: v.spreadM ?? spreadM,
    foliageColor: v.foliageColor || '#2d7a3a',
    flowerColor: v.flowerColor || '#f8bbd0',
    leafShape: v.leafShape || leafShape,
  };
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
    type: {
      type: String,
      enum: [...Object.values(ImageType), 'MAIN', 'DETAIL', 'INFOGRAPHIC'],
      set: (val: string) => (typeof val === 'string' ? val.toLowerCase() : val),
    },
    width: Number,
    height: Number,
    thumbnailUrl: String,
    cardUrl: String,
    fullUrl: String,
    lqip: String,
  },
  { _id: false },
);

const ReviewNoteSchema = new Schema<IReviewNote>(
  {
    at: { type: Date, default: Date.now },
    byUserId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    action: {
      type: String,
      enum: ['SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED', 'REJECTED', 'WITHDRAWN'],
      required: true,
    },
    comment: { type: String, default: null },
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
    status: {
      type: String,
      enum: Object.values(ContentStatus),
      default: ContentStatus.DRAFT,
    },
    owner: { type: Schema.Types.ObjectId, ref: 'User' },
    isFeatured: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reviewNotes: { type: [ReviewNoteSchema], default: [] },
    submittedAt: { type: Date, default: null },
    references: [{ type: String }],
    precautions: [{ type: String }],
    keyBenefits: [{ type: String }],
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    visual: {
      habit: { type: String, enum: Object.values(PlantHabit) },
      heightM: { type: Number },
      spreadM: { type: Number },
      foliageColor: { type: String },
      flowerColor: { type: String },
      leafShape: { type: String, enum: Object.values(LeafShape) },
    },
    modelVersion: { type: Number, default: 0 },
    modelStatus: {
      type: String,
      enum: Object.values(ModelStatus),
      default: ModelStatus.NONE,
    },
    modelTransform: {
      scale: { type: Number },
      rotationY: { type: Number },
      offsetY: { type: Number },
      targetHeightM: { type: Number },
    },
    lastModelError: {
      at: { type: Date },
      message: { type: String },
    },
  },
  { timestamps: true },
);

PlantSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isPublished = this.status === ContentStatus.PUBLISHED;
  } else if (this.isModified('isPublished') && !this.isModified('status')) {
    if (this.isPublished && this.status !== ContentStatus.PUBLISHED) {
      this.status = ContentStatus.PUBLISHED;
    }
  }
  if (!this.owner && this.createdBy) {
    this.owner = this.createdBy;
  }
  next();
});

// Normalize image types before validation
PlantSchema.pre('validate', function (next) {
  if (this.images && Array.isArray(this.images)) {
    for (const img of this.images) {
      if (img && typeof img.type === 'string') {
        img.type = (img.type as string).toLowerCase() as any;
      }
    }
  }
  next();
});

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
PlantSchema.index({ status: 1 });
PlantSchema.index({ owner: 1 });
PlantSchema.index({ createdAt: -1 });

export default mongoose.model<IPlant>('Plant', PlantSchema);
