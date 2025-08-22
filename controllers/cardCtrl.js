const Card = require('../database/models/Card');

// Helper function to generate card number (for demo purposes)
const generateCardNumber = () => {
  return '4' + Math.random().toString().slice(2, 17);
};

// Helper function to generate CVV
const generateCVV = () => {
  return Math.floor(100 + Math.random() * 900).toString();
};

const cardCtrl = {
  createCard: async (req, res) => {
    try {
      const userId = req.user._id;
      const { cardType, cardName, currency, balance } = req.body;

      if (!cardType) {
        return res.status(400).json({ 
          success: false, 
          message: 'Card type is required' 
        });
      }

      // Check if cardType is valid
      const validCardTypes = ['debit', 'credit', 'virtual', 'prepaid'];
      if (!validCardTypes.includes(cardType.toLowerCase())) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card type. Must be: debit, credit, virtual, or prepaid'
        });
      }

      const cardNumber = generateCardNumber();
      const cvv = generateCVV();
      const expiryDate = new Date();
      expiryDate.setFullYear(expiryDate.getFullYear() + 4);

      const cardData = {
        userId,
        cardType: cardType.toLowerCase(),
        cardNumber,
        expiryDate,
        cvv,
        cardName: cardName || `${cardType.toUpperCase()} Card`,
        currency: currency || 'USD',
        balance: parseFloat(balance) || 0
      };

      const card = new Card(cardData);
      await card.save();

      const safeCard = {
        _id: card._id,
        userId: card.userId,
        cardType: card.cardType,
        cardNumber: '**** **** **** ' + card.cardNumber.slice(-4),
        expiryDate: card.expiryDate,
        balance: card.balance,
        cardStatus: card.cardStatus,
        cardName: card.cardName,
        currency: card.currency,
        isFrozen: card.isFrozen,
        isDefault: card.isDefault,
        limits: card.limits,
        createdAt: card.createdAt
      };

      res.status(201).json({ 
        success: true, 
        message: 'Card created successfully',
        data: safeCard 
      });
    } catch (err) {
      console.error('Create Card Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
      });
    }
  },

  getUserCards: async (req, res) => {
    try {
      const userId = req.user._id;
      const cards = await Card.find({ userId }).sort({ createdAt: -1 });

      const safeCards = cards.map(card => ({
        _id: card._id,
        userId: card.userId,
        cardType: card.cardType,
        cardNumber: '**** **** **** ' + card.cardNumber.slice(-4),
        expiryDate: card.expiryDate,
        balance: card.balance,
        cardStatus: card.cardStatus,
        cardName: card.cardName,
        currency: card.currency,
        isFrozen: card.isFrozen,
        isDefault: card.isDefault,
        limits: card.limits,
        createdAt: card.createdAt
      }));

      res.status(200).json({ 
        success: true, 
        message: `Found ${cards.length} cards`,
        data: safeCards 
      });
    } catch (err) {
      console.error('Get User Cards Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
      });
    }
  },

  getCard: async (req, res) => {
    try {
      const userId = req.user._id;
      const cardId = req.params.id;

      // Validate ObjectId format
      if (!cardId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card ID format'
        });
      }

      const card = await Card.findOne({ _id: cardId, userId });

      if (!card) {
        return res.status(404).json({ 
          success: false, 
          message: 'Card not found' 
        });
      }

      const safeCard = {
        _id: card._id,
        userId: card.userId,
        cardType: card.cardType,
        cardNumber: '**** **** **** ' + card.cardNumber.slice(-4),
        expiryDate: card.expiryDate,
        balance: card.balance,
        cardStatus: card.cardStatus,
        cardName: card.cardName,
        currency: card.currency,
        isFrozen: card.isFrozen,
        isDefault: card.isDefault,
        limits: card.limits,
        createdAt: card.createdAt
      };

      res.status(200).json({ 
        success: true,
        message: 'Card retrieved successfully',
        data: safeCard 
      });
    } catch (err) {
      console.error('Get Card Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
      });
    }
  },

  updateCard: async (req, res) => {
    try {
      const userId = req.user._id;
      const cardId = req.params.id;
      const { cardName, isFrozen, isDefault, limits } = req.body;

      // Validate ObjectId format
      if (!cardId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card ID format'
        });
      }

      const updateData = {};
      if (cardName) updateData.cardName = cardName;
      if (typeof isFrozen === 'boolean') updateData.isFrozen = isFrozen;
      if (typeof isDefault === 'boolean') updateData.isDefault = isDefault;
      if (limits) {
        updateData.limits = {};
        if (limits.dailyLimit !== undefined) updateData.limits.dailyLimit = parseFloat(limits.dailyLimit);
        if (limits.monthlyLimit !== undefined) updateData.limits.monthlyLimit = parseFloat(limits.monthlyLimit);
      }

      const card = await Card.findOneAndUpdate(
        { _id: cardId, userId },
        updateData,
        { new: true, runValidators: true }
      );

      if (!card) {
        return res.status(404).json({ 
          success: false, 
          message: 'Card not found' 
        });
      }

      const safeCard = {
        _id: card._id,
        userId: card.userId,
        cardType: card.cardType,
        cardNumber: '**** **** **** ' + card.cardNumber.slice(-4),
        expiryDate: card.expiryDate,
        balance: card.balance,
        cardStatus: card.cardStatus,
        cardName: card.cardName,
        currency: card.currency,
        isFrozen: card.isFrozen,
        isDefault: card.isDefault,
        limits: card.limits,
        updatedAt: card.updatedAt
      };

      res.status(200).json({ 
        success: true, 
        message: 'Card updated successfully',
        data: safeCard
      });
    } catch (err) {
      console.error('Update Card Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
      });
    }
  },

  deleteCard: async (req, res) => {
    try {
      const userId = req.user._id;
      const cardId = req.params.id;

      // Validate ObjectId format
      if (!cardId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid card ID format'
        });
      }

      const card = await Card.findOneAndDelete({ _id: cardId, userId });

      if (!card) {
        return res.status(404).json({ 
          success: false, 
          message: 'Card not found' 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Card deleted successfully',
        data: {
          deletedCardId: cardId,
          cardName: card.cardName
        }
      });
    } catch (err) {
      console.error('Delete Card Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Server error',
        error: err.message 
      });
    }
  }
};

module.exports = cardCtrl;