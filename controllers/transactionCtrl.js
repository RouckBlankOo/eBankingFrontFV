const Transaction = require('../database/models/Transaction');
const Card = require('../database/models/Card');

const transactionCtrl = {
  createTransaction: async (req, res) => {
    try {
      const userId = req.user._id;
      const { 
        cardId, 
        type, 
        amount, 
        currency, 
        description, 
        fromAccount, 
        toAccount, 
        category, 
        location 
      } = req.body;

      // Validate required fields
      if (!type || !amount) {
        return res.status(400).json({
          success: false,
          message: 'Transaction type and amount are required'
        });
      }

      // Validate card ownership if cardId is provided
      if (cardId) {
        const card = await Card.findOne({ _id: cardId, userId });
        if (!card) {
          return res.status(404).json({
            success: false,
            message: 'Card not found or does not belong to user'
          });
        }

        // Check if card is frozen
        if (card.isFrozen) {
          return res.status(400).json({
            success: false,
            message: 'Cannot process transaction: Card is frozen'
          });
        }

        // For withdrawal/payment, check if sufficient balance
        if (['withdrawal', 'payment'].includes(type) && card.balance < parseFloat(amount)) {
          return res.status(400).json({
            success: false,
            message: 'Insufficient balance'
          });
        }
      }

      const transactionData = {
        userId,
        cardId: cardId || null,
        type: type.toLowerCase(),
        amount: parseFloat(amount),
        currency: currency || 'USD',
        description: description || `${type.charAt(0).toUpperCase() + type.slice(1)} transaction`,
        fromAccount,
        toAccount,
        category: category || 'other',
        location,
        status: 'pending' // Default status
      };

      const transaction = new Transaction(transactionData);
      await transaction.save();

      // Update card balance if card transaction
      if (cardId) {
        const card = await Card.findById(cardId);
        let newBalance = card.balance;

        if (['deposit', 'refund', 'interest', 'bonus'].includes(type)) {
          newBalance += parseFloat(amount);
        } else if (['withdrawal', 'payment', 'fee'].includes(type)) {
          newBalance -= parseFloat(amount);
        }

        await Card.findByIdAndUpdate(cardId, { 
          balance: newBalance 
        });

        // Update transaction with balance after
        transaction.balanceAfter = newBalance;
        await transaction.save();
      }

      // Populate card and user info for response
      await transaction.populate('cardId', 'cardName cardType cardNumber');
      await transaction.populate('userId', 'fullName email');

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: {
          _id: transaction._id,
          reference: transaction.reference,
          type: transaction.type,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          description: transaction.description,
          category: transaction.category,
          balanceAfter: transaction.balanceAfter,
          cardInfo: transaction.cardId ? {
            cardName: transaction.cardId.cardName,
            cardType: transaction.cardId.cardType,
            lastFourDigits: transaction.cardId.cardNumber?.slice(-4)
          } : null,
          createdAt: transaction.createdAt
        }
      });
    } catch (err) {
      console.error('Create Transaction Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
    }
  },

  getUserTransactions: async (req, res) => {
    try {
      const userId = req.user._id;
      const { 
        page = 1, 
        limit = 10, 
        status, 
        type, 
        category,
        startDate,
        endDate,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // Build filter object
      const filter = { userId };
      
      if (status) filter.status = status;
      if (type) filter.type = type;
      if (category) filter.category = category;
      
      // Date range filter
      if (startDate || endDate) {
        filter.createdAt = {};
        if (startDate) filter.createdAt.$gte = new Date(startDate);
        if (endDate) filter.createdAt.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'desc' ? -1 : 1;

      const transactions = await Transaction.find(filter)
        .populate('cardId', 'cardName cardType cardNumber')
        .sort({ [sortBy]: sortOrder })
        .limit(parseInt(limit))
        .skip(skip);

      const totalTransactions = await Transaction.countDocuments(filter);
      const totalPages = Math.ceil(totalTransactions / parseInt(limit));

      const safeTransactions = transactions.map(transaction => ({
        _id: transaction._id,
        reference: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        category: transaction.category,
        balanceAfter: transaction.balanceAfter,
        cardInfo: transaction.cardId ? {
          cardName: transaction.cardId.cardName,
          cardType: transaction.cardId.cardType,
          lastFourDigits: transaction.cardId.cardNumber?.slice(-4)
        } : null,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      }));

      res.status(200).json({
        success: true,
        message: `Found ${transactions.length} transactions`,
        data: {
          transactions: safeTransactions,
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalTransactions,
            hasNextPage: parseInt(page) < totalPages,
            hasPrevPage: parseInt(page) > 1
          }
        }
      });
    } catch (err) {
      console.error('Get User Transactions Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
    }
  },

  getTransaction: async (req, res) => {
    try {
      const userId = req.user._id;
      const transactionId = req.params.id;

      // Validate ObjectId format
      if (!transactionId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction ID format'
        });
      }

      const transaction = await Transaction.findOne({ _id: transactionId, userId })
        .populate('cardId', 'cardName cardType cardNumber')
        .populate('userId', 'fullName email');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const safeTransaction = {
        _id: transaction._id,
        reference: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        category: transaction.category,
        fromAccount: transaction.fromAccount,
        toAccount: transaction.toAccount,
        balanceAfter: transaction.balanceAfter,
        fees: transaction.fees,
        location: transaction.location,
        cardInfo: transaction.cardId ? {
          _id: transaction.cardId._id,
          cardName: transaction.cardId.cardName,
          cardType: transaction.cardId.cardType,
          lastFourDigits: transaction.cardId.cardNumber?.slice(-4)
        } : null,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt
      };

      res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: safeTransaction
      });
    } catch (err) {
      console.error('Get Transaction Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
    }
  },

  updateTransaction: async (req, res) => {
    try {
      const userId = req.user._id;
      const transactionId = req.params.id;
      const { status, description, category } = req.body;

      // Validate ObjectId format
      if (!transactionId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction ID format'
        });
      }

      // Only allow certain fields to be updated
      const updateData = {};
      if (status) updateData.status = status;
      if (description) updateData.description = description;
      if (category) updateData.category = category;

      const transaction = await Transaction.findOneAndUpdate(
        { _id: transactionId, userId },
        updateData,
        { new: true, runValidators: true }
      ).populate('cardId', 'cardName cardType cardNumber');

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const safeTransaction = {
        _id: transaction._id,
        reference: transaction.reference,
        type: transaction.type,
        amount: transaction.amount,
        currency: transaction.currency,
        status: transaction.status,
        description: transaction.description,
        category: transaction.category,
        balanceAfter: transaction.balanceAfter,
        cardInfo: transaction.cardId ? {
          cardName: transaction.cardId.cardName,
          cardType: transaction.cardId.cardType,
          lastFourDigits: transaction.cardId.cardNumber?.slice(-4)
        } : null,
        updatedAt: transaction.updatedAt
      };

      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: safeTransaction
      });
    } catch (err) {
      console.error('Update Transaction Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
    }
  },

  deleteTransaction: async (req, res) => {
    try {
      const userId = req.user._id;
      const transactionId = req.params.id;

      // Validate ObjectId format
      if (!transactionId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid transaction ID format'
        });
      }

      const transaction = await Transaction.findOne({ _id: transactionId, userId });

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Only allow deletion of pending or failed transactions
      if (!['pending', 'failed'].includes(transaction.status)) {
        return res.status(400).json({
          success: false,
          message: 'Cannot delete completed transactions'
        });
      }

      await Transaction.findByIdAndDelete(transactionId);

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
        data: {
          deletedTransactionId: transactionId,
          reference: transaction.reference
        }
      });
    } catch (err) {
      console.error('Delete Transaction Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
    }
  },

  // Additional useful methods
  getTransactionStats: async (req, res) => {
    try {
      const userId = req.user._id;
      const { startDate, endDate } = req.query;

      const matchStage = { userId };
      if (startDate || endDate) {
        matchStage.createdAt = {};
        if (startDate) matchStage.createdAt.$gte = new Date(startDate);
        if (endDate) matchStage.createdAt.$lte = new Date(endDate);
      }

      const stats = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      const typeStats = await Transaction.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            totalAmount: { $sum: '$amount' }
          }
        }
      ]);

      res.status(200).json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: {
          statusStats: stats,
          typeStats: typeStats
        }
      });
    } catch (err) {
      console.error('Get Transaction Stats Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
    }
  }
};

module.exports = transactionCtrl;