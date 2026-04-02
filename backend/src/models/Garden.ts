import mongoose, { Schema, Document, Types } from 'mongoose';
import { IGardenPlant, GrowthStage } from '../types';

export interface IGarden extends Document {
  user: Types.ObjectId;
  name: string;
  description: string | null;
  plants: IGardenPlant[];
  createdAt: Date;
  updatedAt: Date;
}

const Vector3Schema = new Schema(
  {
    x: { type: Number, required: true, default: 0 },
    y: { type: Number, required: true, default: 0 },
    z: { type: Number, required: true, default: 0 },
  },
  { _id: false },
);

const GardenPlantSchema = new Schema(
  {
    plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true },
    position: { type: Vector3Schema, required: true },
    rotation: { type: Vector3Schema, required: true, default: { x: 0, y: 0, z: 0 } },
    scale: { type: Number, default: 1 },
    growthStage: {
      type: String,
      enum: Object.values(GrowthStage),
      default: GrowthStage.SEED,
    },
    plantedAt: { type: Date, default: Date.now },
    notes: { type: String, default: null },
  },
  { _id: true },
);

const GardenSchema = new Schema<IGarden>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, default: 'My Garden', trim: true },
    description: { type: String, default: null },
    plants: [GardenPlantSchema],
  },
  { timestamps: true },
);

// Indexes per PRD
GardenSchema.index({ user: 1 }, { unique: true });
GardenSchema.index({ 'plants.plant': 1 });

export default mongoose.model<IGarden>('Garden', GardenSchema);
