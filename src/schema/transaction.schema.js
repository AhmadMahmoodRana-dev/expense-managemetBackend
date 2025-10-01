import mongoose from "mongoose";
const Schema = mongoose.Schema;

const transactionSchema = new Schema({
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
    enum: ['income', 'expense', 'transfer'],
    required: true
  },
  category: {
    type: Schema.Types.ObjectId,
    ref: 'Category',
    required: function() {
      return this.type !== 'transfer';
    }
  },
  fromAccount: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: true
  },
  toAccount: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    required: function() {
      return this.type === 'transfer';
    }
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  time: {
    type: String, // Format: HH:MM
    default: function() {
      const now = new Date();
      return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'other'],
    default: 'cash'
  },
  description: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  receipts: [{
    url: String,
    filename: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  merchant: {
    type: String,
    trim: true
  },
  
  // Recurring transaction details
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringTransactionId: {
    type: Schema.Types.ObjectId,
    ref: 'RecurringTransaction',
    default: null
  },
  
  // Budget tracking
  budgetId: {
    type: Schema.Types.ObjectId,
    ref: 'Budget',
    default: null
  },
  
  // Status
  status: {
    type: String,
    enum: ['completed', 'pending', 'cancelled'],
    default: 'completed'
  },
  
  // Bill payment tracking
  billId: {
    type: Schema.Types.ObjectId,
    ref: 'Bill',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for better query performance
transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, category: 1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, fromAccount: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;