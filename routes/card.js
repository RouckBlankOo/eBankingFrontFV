const express = require('express');
const router = express.Router();
const cardCtrl = require('../controllers/cardCtrl');
const auth = require('../middleware/authMiddleware'); // Import auth middleware

/**
 * @swagger
 * tags:
 *   name: Card
 *   description: User card management
 */

/**
 * @swagger
 * /api/cards:
 *   post:
 *     summary: Create a new card
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardType
 *             properties:
 *               cardType:
 *                 type: string
 *                 enum: [debit, credit, virtual, prepaid]
 *               cardName:
 *                 type: string
 *               currency:
 *                 type: string
 *                 default: USD
 *               balance:
 *                 type: number
 *                 default: 0
 *     responses:
 *       201:
 *         description: Card created successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 */
router.post('/', auth, cardCtrl.createCard);

/**
 * @swagger
 * /api/cards:
 *   get:
 *     summary: Get all user cards
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cards retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/', auth, cardCtrl.getUserCards);

/**
 * @swagger
 * /api/cards/{id}:
 *   get:
 *     summary: Get a specific card
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card retrieved successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', auth, cardCtrl.getCard);

/**
 * @swagger
 * /api/cards/{id}:
 *   put:
 *     summary: Update a card
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               cardName:
 *                 type: string
 *               isFrozen:
 *                 type: boolean
 *               isDefault:
 *                 type: boolean
 *               limits:
 *                 type: object
 *                 properties:
 *                   dailyLimit:
 *                     type: number
 *                   monthlyLimit:
 *                     type: number
 *     responses:
 *       200:
 *         description: Card updated successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', auth, cardCtrl.updateCard);

/**
 * @swagger
 * /api/cards/{id}:
 *   delete:
 *     summary: Delete a card
 *     tags: [Card]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *       404:
 *         description: Card not found
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', auth, cardCtrl.deleteCard);

module.exports = router;