import mongoose from "mongoose";
const Schema = mongoose.Schema;

const billSchema = new Schema({
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
  amount: {
    type: Number,
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
  dueDate: {
    type: Date,
    required: true
  },
  
  // Recurrence (if recurring bill)
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'RecurringTransaction',
    default: null
  },
  
  // Payment tracking
  status: {
    type: String,
    enum: ['unpaid', 'paid', 'overdue', 'cancelled'],
    default: 'unpaid'
  },
  paidDate: {
    type: Date,
    default: null
  },
  transactionId: {
    type: Schema.Types.ObjectId,
    ref: 'Transaction',
    default: null
  },
  
  // Reminder settings
  remindBefore: {
    type: Number,
    default: 3 // Days before due date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  
  // Additional info
  merchant: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  attachments: [{
    url: String,
    filename: String,
    uploadDate: { type: Date, default: Date.now }
  }]
}, {
  timestamps: true
});

billSchema.index({ userId: 1, dueDate: 1 });
billSchema.index({ userId: 1, status: 1 });

const Bill = mongoose.model('Bill', billSchema);
export default Bill;