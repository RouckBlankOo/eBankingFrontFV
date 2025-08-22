const express = require('express');
const router = express.Router();
const verificationCtrl = require('../controllers/verificationCtrl');

/**
 * @swagger
 * tags:
 *   name: Verification
 *   description: User verification management
 */

/**
 * @swagger
 * /verification/send-email-otp:
 *   post:
 *     summary: Send OTP to email
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: user@example.com
 */
router.post('/send-email-otp', verificationCtrl.sendEmailOtp);

/**
 * @swagger
 * /verification/verify-email-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Verification]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 */
router.post('/verify-email-otp', verificationCtrl.verifyEmailOtp);

router.post('/send-phone-otp', verificationCtrl.sendPhoneOtp);
router.post('/verify-phone-otp', verificationCtrl.verifyPhoneOtp);

module.exports = router;