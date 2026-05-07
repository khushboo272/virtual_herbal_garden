import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  description: string | null;
  iconUrl: string | null;
  parent: Types.ObjectId | null;
  sortOrder: number;
  createdAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, unique: true, required: true, lowercase: true },
    description: { type: String, default: null },
    iconUrl: { type: String, default: null },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ parent: 1 });

export default mongoose.model<ICategory>('Category', CategorySchema);
