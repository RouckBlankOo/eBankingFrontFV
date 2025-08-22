const Verification = require('../database/models/verification'); // Use correct model name
const User = require('../database/models/User');

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const sendEmailOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete any existing OTPs for this user and type
    await Verification.deleteMany({ userId: user._id, type: 'email' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min expiry
    
    await Verification.create({ 
      userId: user._id, 
      type: 'email',
      otp, 
      expiresAt 
    });

    // TODO: Send OTP to user's email
    console.log(`Email OTP for ${email}: ${otp}`); // For testing purposes
    
    res.json({ success: true, message: 'OTP sent to email' });
  } catch (err) {
    console.error('Send email OTP error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const verifyEmailOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpDoc = await Verification.findOne({ 
      userId: user._id, 
      type: 'email',
      otp 
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (otpDoc.expiresAt < new Date()) {
      await Verification.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Mark as verified and delete the OTP
    await Verification.findByIdAndUpdate(otpDoc._id, { verified: true });
    await Verification.deleteOne({ _id: otpDoc._id });

    res.json({ success: true, message: 'Email OTP verified successfully' });
  } catch (err) {
    console.error('Verify email OTP error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const sendPhoneOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone) {
      return res.status(400).json({ success: false, message: 'Phone number is required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete any existing OTPs for this user and type
    await Verification.deleteMany({ userId: user._id, type: 'phone' });

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    
    await Verification.create({ 
      userId: user._id, 
      type: 'phone',
      otp, 
      expiresAt 
    });

    // TODO: Send OTP to user's phone
    console.log(`Phone OTP for ${phone}: ${otp}`); // For testing purposes
    
    res.json({ success: true, message: 'OTP sent to phone' });
  } catch (err) {
    console.error('Send phone OTP error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

const verifyPhoneOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    
    if (!phone || !otp) {
      return res.status(400).json({ success: false, message: 'Phone number and OTP are required' });
    }

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const otpDoc = await Verification.findOne({ 
      userId: user._id, 
      type: 'phone',
      otp 
    });

    if (!otpDoc) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (otpDoc.expiresAt < new Date()) {
      await Verification.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ success: false, message: 'OTP has expired' });
    }

    // Mark as verified and delete the OTP
    await Verification.findByIdAndUpdate(otpDoc._id, { verified: true });
    await Verification.deleteOne({ _id: otpDoc._id });

    res.json({ success: true, message: 'Phone OTP verified successfully' });
  } catch (err) {
    console.error('Verify phone OTP error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  sendEmailOtp,
  verifyEmailOtp,
  sendPhoneOtp,
  verifyPhoneOtp
};