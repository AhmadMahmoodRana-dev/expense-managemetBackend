import mongoose from "mongoose";
const Schema = mongoose.Schema;

const budgetSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true,
    default: 'Monthly Budget'
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  categories: [{
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },
    budgetAmount: {
      type: Number,
      required: true,
      min: 0
    },
    spentAmount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  totalBudget: {
    type: Number,
    required: true
  },
  totalSpent: {
    type: Number,
    default: 0
  },
  
  // Settings
  rolloverUnused: {
    type: Boolean,
    default: false // Roll unused budget to next month
  },
  alertThreshold: {
    type: Number,
    default: 80, // Alert when 80% of budget is used
    min: 0,
    max: 100
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'exceeded'],
    default: 'active'
  }
}, {
  timestamps: true
});

// Unique budget per user per month/year
budgetSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;