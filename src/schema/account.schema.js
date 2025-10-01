import mongoose from "mongoose";
const Schema = mongoose.Schema;

const accountSchema = new Schema({
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
    enum: ['bank', 'cash', 'credit_card', 'digital_wallet', 'investment', 'other'],
    required: true
  },
  balance: {
    type: Number,
    required: true,
    default: 0
  },
  initialBalance: {
    type: Number,
    required: true,
    default: 0
  },
  currency: {
    type: String,
    default: 'USD'
  },
  accountNumber: {
    type: String,
    trim: true // Last 4 digits only for security
  },
  bankName: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#10b981' // For visual identification
  },
  icon: {
    type: String,
    default: 'wallet'
  },
  includeInTotal: {
    type: Boolean,
    default: true // Whether to include in total balance calculation
  },
  creditLimit: {
    type: Number,
    default: null // For credit cards
  },
  notes: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

accountSchema.index({ userId: 1 });

const Account = mongoose.model('Account', accountSchema);
export default Account;