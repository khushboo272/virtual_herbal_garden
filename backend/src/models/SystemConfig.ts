import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemConfig extends Document<string> {
  _id: string;
  aiModelVersion: string;
  featuredPlantIds: mongoose.Types.ObjectId[];
  maintenanceMode: boolean;
  allowedDetectionsPerHour: number;
  featureFlags: Map<string, boolean>;
  updatedAt: Date;
}

const SystemConfigSchema = new Schema<ISystemConfig>(
  {
    _id: { type: String, default: 'global' },
    aiModelVersion: { type: String, default: 'v2.3.1' },
    featuredPlantIds: [{ type: Schema.Types.ObjectId, ref: 'Plant' }],
    maintenanceMode: { type: Boolean, default: false },
    allowedDetectionsPerHour: { type: Number, default: 10 },
    featureFlags: { type: Map, of: Boolean, default: new Map() },
  },
  { timestamps: true },
);

export default mongoose.model<ISystemConfig>('SystemConfig', SystemConfigSchema);

