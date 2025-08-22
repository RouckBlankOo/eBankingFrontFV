const express = require('express');
const router = express.Router();
const transactionCtrl = require('../controllers/transactionCtrl');
const auth = require('../middleware/authMiddleware');

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
 *               type:
 *                 type: string
 *                 enum: [deposit, withdrawal, transfer, payment, refund, fee, interest, bonus]
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *               currency:
 *                 type: string
 *                 default: USD
 *               description:
 *                 type: string
 *               fromAccount:
 *                 type: string
 *               toAccount:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [food, transport, entertainment, shopping, bills, healthcare, education, other]
 *               location:
 *                 type: string
 *     responses:
 *       201:
 *         description: Transaction created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Card not found
 */
router.post('/', auth, transactionCtrl.createTransaction);

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
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed, cancelled, processing]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [deposit, withdrawal, transfer, payment, refund, fee, interest, bonus]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [food, transport, entertainment, shopping, bills, healthcare, education, other]
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
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           default: createdAt
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *     responses:
 *       200:
 *         description: Transactions retrieved successfully
 *       401:
 *         description: Unauthorized
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
router.get('/:id', auth, transactionCtrl.getTransaction);

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
router.put('/:id', auth, transactionCtrl.updateTransaction);

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
router.delete('/:id', auth, transactionCtrl.deleteTransaction);

module.exports = router;