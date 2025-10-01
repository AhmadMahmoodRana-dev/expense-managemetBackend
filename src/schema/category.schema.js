import mongoose from "mongoose";
const Schema = mongoose.Schema;

const categorySchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  icon: {
    type: String,
    default: 'folder' // Icon name from lucide-react or emoji
  },
  color: {
    type: String,
    default: '#6366f1' // Hex color code
  },
  parentCategory: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    default: null // For sub-categories
  },
  description: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false // System default categories cannot be deleted
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0 // For custom sorting
  }
}, {
  timestamps: true
});

// Compound index for unique category per user
categorySchema.index({ userId: 1, name: 1, type: 1 }, { unique: true });


const Category = mongoose.model('Category', categorySchema);
export default Category;