const mongoose = require('mongoose');

const CardSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'User ID is required']
  },
  cardType: { 
    type: String, 
    required: [true, 'Card type is required'], 
    enum: {
      values: ['debit', 'credit', 'virtual', 'prepaid'],
      message: 'Card type must be debit, credit, virtual, or prepaid'
    }
  },
  cardNumber: { 
    type: String, 
    required: [true, 'Card number is required'],
    unique: true
  },
  expiryDate: { 
    type: Date, 
    required: [true, 'Expiry date is required']
  },
  cvv: { 
    type: String, 
    required: [true, 'CVV is required'],
    minlength: [3, 'CVV must be at least 3 characters'],
    maxlength: [4, 'CVV cannot exceed 4 characters']
  },
  balance: { 
    type: Number, 
    default: 0.00,
    min: [0, 'Balance cannot be negative']
  },
  isFrozen: { 
    type: Boolean, 
    default: false 
  },
  cardStatus: { 
    type: String, 
    enum: {
      values: ['active', 'blocked', 'expired'],
      message: 'Card status must be active, blocked, or expired'
    }, 
    default: 'active' 
  },
  currency: { 
    type: String, 
    default: 'USD',
    uppercase: true
  },
  cardName: { 
    type: String,
    trim: true
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  },
  limits: {
    dailyLimit: { 
      type: Number, 
      default: 1000,
      min: [0, 'Daily limit cannot be negative']
    },
    monthlyLimit: { 
      type: Number, 
      default: 10000,
      min: [0, 'Monthly limit cannot be negative']
    }
  }
}, {
  timestamps: true
});

// Index for better query performance
CardSchema.index({ userId: 1 });
CardSchema.index({ cardNumber: 1 }, { unique: true });

// Pre-save middleware to ensure only one default card per user
CardSchema.pre('save', async function(next) {
  if (this.isDefault && this.isModified('isDefault')) {
    await this.constructor.updateMany(
      { userId: this.userId, _id: { $ne: this._id } },
      { isDefault: false }
    );
  }
  next();
});

// Pre-update middleware for findOneAndUpdate
CardSchema.pre('findOneAndUpdate', async function(next) {
  const update = this.getUpdate();
  if (update.isDefault === true) {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      await this.model.updateMany(
        { userId: doc.userId, _id: { $ne: doc._id } },
        { isDefault: false }
      );
    }
  }
  next();
});

module.exports = mongoose.model('Card', CardSchema);