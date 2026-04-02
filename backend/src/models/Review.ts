import mongoose, { Schema, Document, Types } from 'mongoose';
import Plant from './Plant';

export interface IReview extends Document {
  plant: Types.ObjectId;
  user: Types.ObjectId;
  rating: number;
  title: string | null;
  body: string | null;
  helpfulCount: number;
  isFlagged: boolean;
  flagReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    plant: { type: Schema.Types.ObjectId, ref: 'Plant', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, maxlength: 200, default: null },
    body: { type: String, maxlength: 2000, default: null },
    helpfulCount: { type: Number, default: 0 },
    isFlagged: { type: Boolean, default: false },
    flagReason: { type: String, default: null },
  },
  { timestamps: true },
);

// Indexes per PRD
ReviewSchema.index({ plant: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ isFlagged: 1 });
ReviewSchema.index({ plant: 1, user: 1 }, { unique: true }); // one review per user per plant

// Post-save hook: recalculate plant avgRating atomically (PRD §7.3)
ReviewSchema.post('save', async function () {
  const Review = mongoose.model<IReview>('Review');
  const stats = await Review.aggregate([
    { $match: { plant: this.plant } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  await Plant.findByIdAndUpdate(this.plant, {
    avgRating: stats[0]?.avg || 0,
    reviewCount: stats[0]?.count || 0,
  });
});

// Post-remove hook: recalculate on delete
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    const Review = mongoose.model<IReview>('Review');
    const stats = await Review.aggregate([
      { $match: { plant: doc.plant } },
      { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
    ]);
    await Plant.findByIdAndUpdate(doc.plant, {
      avgRating: stats[0]?.avg || 0,
      reviewCount: stats[0]?.count || 0,
    });
  }
});

export default mongoose.model<IReview>('Review', ReviewSchema);
