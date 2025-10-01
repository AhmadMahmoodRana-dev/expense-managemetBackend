import mongoose from "mongoose";
const Schema = mongoose.Schema;
const recurringTransactionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  account: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  
  // Recurrence settings
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    required: true
  },
  interval: {
    type: Number,
    default: 1 // Every 1 week, every 2 months, etc.
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null // Null means no end date
  },
  occurrences: {
    type: Number,
    default: null // Number of times to repeat (alternative to endDate)
  },
  completedOccurrences: {
    type: Number,
    default: 0
  },
  nextOccurrence: {
    type: Date,
    required: true
  },
  
  // Settings
  autoAdd: {
    type: Boolean,
    default: false // Automatically create transaction
  },
  requireConfirmation: {
    type: Boolean,
    default: true
  },
  
  // Reminder settings
  remindBefore: {
    type: Number,
    default: 1 // Days before
  },
  reminderEnabled: {
    type: Boolean,
    default: true
  },
  
  description: {
    type: String,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'],
    default: 'cash'
  },
  
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

recurringTransactionSchema.index({ userId: 1, nextOccurrence: 1 });
recurringTransactionSchema.index({ userId: 1, isActive: 1 });

const RecurringTransaction = mongoose.model('RecurringTransaction', recurringTransactionSchema);
export default RecurringTransaction;