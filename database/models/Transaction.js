const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required']
  },
  cardId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Card',
    required: false // Some transactions might not be card-based
  },
  type: { 
    type: String, 
    required: [true, 'Transaction type is required'],
    enum: {
      values: ['deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee', 'interest', 'bonus'],
      message: 'Transaction type must be: deposit, withdrawal, transfer, payment, refund, fee, interest, or bonus'
    }
  },
  amount: { 
    type: Number, 
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  currency: { 
    type: String, 
    required: [true, 'Currency is required'],
    default: 'USD',
    uppercase: true,
    minlength: [3, 'Currency code must be 3 characters'],
    maxlength: [3, 'Currency code must be 3 characters']
  },
  status: { 
    type: String, 
    required: [true, 'Transaction status is required'],
    enum: {
      values: ['pending', 'completed', 'failed', 'cancelled', 'processing'],
      message: 'Status must be: pending, completed, failed, cancelled, or processing'
    },
    default: 'pending'
  },
  description: { 
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  // Additional fields for better transaction tracking
  reference: {
    type: String,
    unique: true,
    sparse: true // Allows multiple null values
  },
  fromAccount: {
    type: String,
    trim: true
  },
  toAccount: {
    type: String,
    trim: true
  },
  balanceAfter: {
    type: Number,
    min: [0, 'Balance cannot be negative']
  },
  fees: {
    type: Number,
    default: 0,
    min: [0, 'Fees cannot be negative']
  },
  category: {
    type: String,
    enum: ['food', 'transport', 'entertainment', 'shopping', 'bills', 'healthcare', 'education', 'other'],
    default: 'other'
  },
  location: {
    type: String,
    trim: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // For storing additional transaction data
    default: {}
  }
}, {
  timestamps: true // This automatically creates createdAt and updatedAt
});

// Indexes for better query performance
TransactionSchema.index({ userId: 1, createdAt: -1 });
TransactionSchema.index({ cardId: 1 });
TransactionSchema.index({ status: 1 });
TransactionSchema.index({ type: 1 });
TransactionSchema.index({ reference: 1 }, { unique: true, sparse: true });

// Pre-save middleware to generate reference number
TransactionSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
  }
  next();
});

// Virtual for transaction age
TransactionSchema.virtual('transactionAge').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)); // Days
});

// Ensure virtual fields are serialized
TransactionSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Transaction', TransactionSchema);