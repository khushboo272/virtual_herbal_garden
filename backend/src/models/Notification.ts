import mongoose, { Schema, Document, Types } from 'mongoose';
import { NotificationType } from '../types';

export interface INotification extends Document {
  user: Types.ObjectId;
  type: NotificationType;
  title: string;
  body: string;
  actionUrl: string | null;
  isRead: boolean;
  expiresAt: Date;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: Object.values(NotificationType),
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    actionUrl: { type: String, default: null },
    isRead: { type: Boolean, default: false },
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
    },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// TTL: auto-delete after 90 days
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
NotificationSchema.index({ user: 1, isRead: 1 });

export default mongoose.model<INotification>('Notification', NotificationSchema);
