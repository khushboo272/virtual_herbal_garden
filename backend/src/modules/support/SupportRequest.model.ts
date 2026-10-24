import mongoose, { Schema, Document, Types } from 'mongoose';

export type SupportStatus = 'OPEN' | 'CLOSED';

export interface ISupportRequest extends Document {
  userId: Types.ObjectId;
  subject: string;
  message: string;
  status: SupportStatus;
  createdAt: Date;
  updatedAt: Date;
}

const SupportRequestSchema = new Schema<ISupportRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    subject: { type: String, required: true, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
  },
  { timestamps: true },
);

export default mongoose.model<ISupportRequest>('SupportRequest', SupportRequestSchema);
