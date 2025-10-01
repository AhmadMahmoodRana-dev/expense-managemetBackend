const backupSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // In bytes
    required: true
  },
  backupType: {
    type: String,
    enum: ['manual', 'automatic', 'scheduled'],
    default: 'manual'
  },
  dataIncluded: {
    transactions: { type: Boolean, default: true },
    categories: { type: Boolean, default: true },
    accounts: { type: Boolean, default: true },
    budgets: { type: Boolean, default: true },
    goals: { type: Boolean, default: true },
    bills: { type: Boolean, default: true }
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'in_progress'],
    default: 'completed'
  }
}, {
  timestamps: true
});

backupSchema.index({ userId: 1, createdAt: -1 });

const Backup = mongoose.model('Backup', backupSchema);
export default Backup;