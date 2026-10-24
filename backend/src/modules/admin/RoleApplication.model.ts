import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../../types';

export enum RoleApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface IRoleApplication extends Document {
  userId: Types.ObjectId;
  requestedRole: UserRole;
  motivation: string;
  qualifications: string;
  links: string[];
  status: RoleApplicationStatus;
  reviewerId?: Types.ObjectId | null;
  reviewNote?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const RoleApplicationSchema = new Schema<IRoleApplication>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    requestedRole: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.BOTANIST,
      required: true,
    },
    motivation: { type: String, required: true, minlength: 50, maxlength: 3000, trim: true },
    qualifications: { type: String, required: true, maxlength: 2000, trim: true },
    links: {
      type: [{ type: String, trim: true }],
      validate: [(val: string[]) => val.length <= 3, 'Maximum 3 reference links allowed'],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(RoleApplicationStatus),
      default: RoleApplicationStatus.PENDING,
      index: true,
    },
    reviewerId: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    reviewNote: { type: String, default: null, trim: true },
    reviewedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

RoleApplicationSchema.index({ userId: 1, status: 1 });
RoleApplicationSchema.index({ createdAt: -1 });

export default mongoose.model<IRoleApplication>('RoleApplication', RoleApplicationSchema);
