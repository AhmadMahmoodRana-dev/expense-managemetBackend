const goalSchema = new Schema({
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
  targetAmount: {
    type: Number,
    required: true,
    min: 0
  },
  currentAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  targetDate: {
    type: Date,
    required: true
  },
  
  // Goal details
  type: {
    type: String,
    enum: ['emergency_fund', 'vacation', 'purchase', 'investment', 'debt_payment', 'education', 'custom'],
    default: 'custom'
  },
  icon: {
    type: String,
    default: 'target'
  },
  color: {
    type: String,
    default: '#3b82f6'
  },
  image: {
    type: String, // URL to goal image
    default: null
  },
  
  // Contribution settings
  monthlyContribution: {
    type: Number,
    default: 0
  },
  autoSave: {
    type: Boolean,
    default: false
  },
  linkedAccount: {
    type: Schema.Types.ObjectId,
    ref: 'Account',
    default: null
  },
  
  description: {
    type: String,
    trim: true
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled', 'paused'],
    default: 'active'
  },
  completedDate: {
    type: Date,
    default: null
  },
  
  // Progress tracking
  milestones: [{
    amount: Number,
    date: { type: Date, default: Date.now },
    note: String
  }]
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, status: 1 });
goalSchema.index({ userId: 1, targetDate: 1 });


const Goal = mongoose.model('Goal', goalSchema);
export default Goal;