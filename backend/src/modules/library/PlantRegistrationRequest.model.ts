import mongoose, { Document, Schema } from 'mongoose';

export type PlantRequestStatus = 'PENDING' | 'RESEARCHING' | 'CATALOGED' | 'DISMISSED';

export interface IPlantRegistrationRequest extends Document {
  commonName: string;
  scientificName?: string;
  family?: string;
  description?: string;
  medicinalUses: string[];
  imageUrl?: string;
  notes?: string;
  requestedBy?: mongoose.Types.ObjectId;
  requesterName?: string;
  requesterEmail?: string;
  status: PlantRequestStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  adminNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PlantRegistrationRequestSchema = new Schema<IPlantRegistrationRequest>(
  {
    commonName: { type: String, required: true, trim: true, index: true },
    scientificName: { type: String, trim: true, default: '' },
    family: { type: String, trim: true, default: '' },
    description: { type: String, trim: true, default: '' },
    medicinalUses: { type: [String], default: [] },
    imageUrl: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    requesterName: { type: String, trim: true, default: 'A dedicated visitor' },
    requesterEmail: { type: String, trim: true, default: '' },
    status: {
      type: String,
      enum: ['PENDING', 'RESEARCHING', 'CATALOGED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    adminNotes: { type: String, trim: true, default: '' },
  },
  { timestamps: true },
);

PlantRegistrationRequestSchema.index({ createdAt: -1 });

export default mongoose.model<IPlantRegistrationRequest>(
  'PlantRegistrationRequest',
  PlantRegistrationRequestSchema,
);

