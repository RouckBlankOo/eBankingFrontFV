const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const transactionCtrl = require('../controllers/transactionCtrl');
const auth = require('../middleware/authMiddleware');

// Rate limiting for transaction creation (more restrictive)
const transactionCreateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 transactions per minute per IP
  message: {
    success: false,
    message: 'Too many transaction attempts. Please wait before trying again.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validation middleware for transaction creation
const validateTransactionCreate = (req, res, next) => {
  const { type, amount } = req.body;
  
  // Check required fields
  if (!type) {
    return res.status(400).json({
      success: false,
      message: 'Transaction type is required'
    });
  }
  
  if (!amount) {
    return res.status(400).json({
      success: false,
      message: 'Transaction amount is required'
    });
  }
  
  // Validate transaction type
  const validTypes = ['deposit', 'withdrawal', 'transfer', 'payment', 'refund', 'fee', 'interest', 'bonus'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      message: `Invalid transaction type. Must be one of: ${validTypes.join(', ')}`
    });
  }
  
  // Validate amount
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) {
    return res.status(400).json({
      success: false,
      message: 'Amount must be a positive number'
    });
  }
  
  // Validate category if provided
  if (req.body.category) {
    const validCategories = ['food', 'transport', 'entertainment', 'shopping', 'bills', 'healthcare', 'education', 'other'];
    if (!validCategories.includes(req.body.category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Must be one of: ${validCategories.join(', ')}`
      });
    }
  }
  
  next();
};

// Validation middleware for ObjectId parameters
const validateObjectId = (req, res, next) => {
  const { id } = req.params;
  
  if (!id || !id.match(/^[0-9a-fA-F]{24}$/)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid transaction ID format'
    });
  }
  
  next();
};

/**
 * @swagger
 * tags:
 *   name: Transaction
 *   description: Financial transaction management
 * 
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */

/**
 * @swagger
 * /api/transaction:
 *   post:
 *     summary: Create a new transaction
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - amount
 *             properties:
 *               cardId:
 *                 type: string
 *                 description: Card ID (optional)
 *                 example: "64b1f1234567890abcdef123"
 *               type:
 *                 type: string
 *                 enum: [deposit, withdrawal, transfer, payment, refund, fee, interest, bonus]
 *                 example: "payment"
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 example: 100.50
 *               currency:
 *                 type: string
 *                 default: "USD"
 *                 example: "USD"
 *               description:
 *                 type: string
 *                 example: "Coffee shop payment"
 *               fromAccount:
 *                 type: string
 *                 example: "user_account_123"
 *               toAccount:
 *                 type: string
 *                 example: "merchant_account_456"
 *               category:
 *                 type: string
 *                 enum: [food, transport, entertainment, shopping, bills, healthcare, education, other]
 *                 example: "food"
 *               location:
 *                 type: string
 *                 example: "Starbucks Downtown"
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transaction created successfully"
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request - validation failed
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Card not found or insufficient balance
 *       500:
 *         description: Internal server error
 */
router.post('/', transactionCreateLimiter, auth, validateTransactionCreate, transactionCtrl.createTransaction);

/**
 * @swagger
 * /api/transaction:
 *   get:
 *     summary: Get user transactions with pagination and filters
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         description: Page number for pagination
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *           example: 1
 *       - in: query
 *         name: limit
 *         description: Number of transactions per page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *           example: 10
 *       - in: query
 *         name: status
 *         description: Filter by transaction status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, processing]
 *           example: completed
 *       - in: query
 *         name: type
 *         description: Filter by transaction type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer, payment, refund, fee, interest, bonus]
 *           example: payment
 *       - in: query
 *         name: category
 *         description: Filter by transaction category
 *         schema:
 *           type: string
 *           enum: [food, transport, entertainment, shopping, bills, healthcare, education, other]
 *           example: food
 *       - in: query
 *         name: startDate
 *         description: Filter transactions from this date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-01-01"
 *       - in: query
 *         name: endDate
 *         description: Filter transactions up to this date (YYYY-MM-DD)
 *         schema:
 *           type: string
 *           format: date
 *           example: "2025-12-31"
 *       - in: query
 *         name: sortBy
 *         description: Field to sort transactions by
 *         schema:
 *           type: string
 *           enum: [createdAt, amount, type, status]
 *           default: createdAt
 *           example: createdAt
 *       - in: query
 *         name: order
 *         description: Sort order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *           example: desc
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Transactions retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     transactions:
 *                       type: array
 *                     pagination:
 *                       type: object
 *                     filters:
 *                       type: object
 *       400:
 *         description: Bad request - invalid parameters
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get('/', auth, transactionCtrl.getUserTransactions);

/**
 * @swagger
 * /api/transaction/stats:
 *   get:
 *     summary: Get transaction statistics
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Transaction statistics retrieved successfully
 *       401:
 *         description: Unauthorized
 */
// IMPORTANT: /stats route must come BEFORE /:id route to avoid conflicts
router.get('/stats', auth, transactionCtrl.getTransactionStats);

/**
 * @swagger
 * /api/transaction/{id}:
 *   get:
 *     summary: Get a specific transaction
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction retrieved successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', auth, validateObjectId, transactionCtrl.getTransaction);

/**
 * @swagger
 * /api/transaction/{id}:
 *   put:
 *     summary: Update a transaction
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, completed, failed, cancelled, processing]
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [food, transport, entertainment, shopping, bills, healthcare, education, other]
 *     responses:
 *       200:
 *         description: Transaction updated successfully
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', auth, validateObjectId, transactionCtrl.updateTransaction);

/**
 * @swagger
 * /api/transaction/{id}:
 *   delete:
 *     summary: Delete a transaction
 *     tags: [Transaction]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Transaction deleted successfully
 *       400:
 *         description: Cannot delete completed transactions
 *       404:
 *         description: Transaction not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', auth, validateObjectId, transactionCtrl.deleteTransaction);

module.exports = router;