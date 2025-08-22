const express = require('express');
const router = express.Router();
const authCtrl = require("../controllers/authctrl.js");
const auth = require('../middleware/authMiddleware');

// Public routes
router.post('/register', authCtrl.registerUser);
router.post('/login', authCtrl.loginUser);
router.post('/send-otp', authCtrl.sendOtp);
router.post('/verify-otp', authCtrl.verifyOtp);

// Protected routes
router.get('/me', auth, authCtrl.getCurrentUser);
router.post('/logout', auth, authCtrl.logout);

module.exports = router;