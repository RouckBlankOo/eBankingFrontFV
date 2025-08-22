const User = require('../database/models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const ejs = require('ejs');
const path = require('path');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const authCtrl = {
  registerUser: async (req, res) => {
    console.log('🚀 Register endpoint hit');
    console.log('📝 Request body:', req.body);
    
    try {
      // Support both documentation format and your current format
      const { 
        fullName, 
        phoneNumber, 
        email, 
        password,
        // Legacy support
        username,
        phone,
        firstName,
        lastName 
      } = req.body;

      // Handle both formats
      const finalPhone = phoneNumber || phone;
      const finalUsername = username || (email ? email.split('@')[0] : null);
      
      let finalFirstName = firstName;
      let finalLastName = lastName;
      
      // If fullName is provided, split it
      if (fullName && !firstName && !lastName) {
        const nameParts = fullName.trim().split(' ');
        finalFirstName = nameParts[0];
        finalLastName = nameParts.slice(1).join(' ') || '';
      }

      // Validation
      if (!finalPhone || !email || !password) {
        console.log('❌ Validation failed: Missing required fields');
        return res.status(400).json({ 
          success: false, 
          message: 'Phone number, email, and password are required',
          errors: [
            { field: 'phoneNumber', message: 'Phone number is required' },
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      }

      // Password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        return res.status(400).json({
          success: false,
          message: 'Password does not meet requirements',
          errors: [
            { 
              field: 'password', 
              message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character' 
            }
          ]
        });
      }

      console.log('✅ Basic validation passed');

      // Check if user already exists
      console.log('🔍 Checking for existing user...');
      const existingUser = await User.findOne({
        $or: [{ email }, { phone: finalPhone }, { username: finalUsername }]
      });

      if (existingUser) {
        console.log('❌ User already exists');
        let conflictField = 'account';
        if (existingUser.email === email) conflictField = 'email';
        else if (existingUser.phone === finalPhone) conflictField = 'phone number';
        else if (existingUser.username === finalUsername) conflictField = 'username';
        
        return res.status(400).json({
          success: false,
          message: `User with this ${conflictField} already exists`,
          errors: [
            { field: conflictField.replace(' ', ''), message: `This ${conflictField} is already registered` }
          ]
        });
      }

      console.log('✅ No existing user found');

      // Hash password
      console.log('🔒 Hashing password...');
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      console.log('✅ Password hashed successfully');

      // Create new user
      console.log('👤 Creating new user...');
      const newUser = new User({
        username: finalUsername,
        phone: finalPhone,
        email,
        password: hashedPassword,
        personalInfo: {
          firstName: finalFirstName || '',
          lastName: finalLastName || ''
        }
      });

      console.log('💾 Saving user to database...');
      const savedUser = await newUser.save();
      console.log('✅ User saved successfully with ID:', savedUser._id);

      // Generate JWT token
      console.log('🎫 Generating JWT token...');
      const token = jwt.sign(
        { userId: savedUser._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Update user with token
      console.log('🔄 Updating user with token...');
      savedUser.userMeta.token = token;
      await savedUser.save();

      console.log('🎉 Registration completed successfully!');

      // Response matching documentation format
      res.status(201).json({
        success: true,
        message: "User registered successfully. Verification codes sent to email and phone.",
        data: {
          userId: savedUser._id,
          email: savedUser.email,
          phoneNumber: savedUser.phone,
          fullName: `${finalFirstName || ''} ${finalLastName || ''}`.trim() || savedUser.username,
          token: token
        }
      });

    } catch (err) {
      console.error('💥 Register Error Details:');
      console.error('Error name:', err.name);
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      
      if (err.name === 'ValidationError') {
        const errors = Object.values(err.errors).map(e => ({
          field: e.path,
          message: e.message
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(400).json({
          success: false,
          message: `${field} already exists`,
          errors: [
            { field, message: `This ${field} is already registered` }
          ]
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  loginUser: async (req, res) => {
    console.log('🔐 Login endpoint hit');
    console.log('📝 Request body:', { ...req.body, password: '[HIDDEN]' });
    
    try {
      const { email, emailOrPhone, password } = req.body;
      const loginIdentifier = email || emailOrPhone;

      if (!loginIdentifier || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email and password are required',
          errors: [
            { field: 'email', message: 'Email is required' },
            { field: 'password', message: 'Password is required' }
          ]
        });
      }

      console.log('🔍 Looking for user...');
      // Find user by email or phone
      const user = await User.findOne({
        $or: [{ email: loginIdentifier }, { phone: loginIdentifier }]
      });

      if (!user) {
        console.log('❌ User not found');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      console.log('✅ User found, checking password...');
      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        console.log('❌ Invalid password');
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      console.log('✅ Password valid, generating token...');
      // Generate new token
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { userId: user._id, type: 'refresh' },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      // Update user token
      user.userMeta.token = token;
      await user.save();

      console.log('🎉 Login successful!');

      // Response matching documentation format
      res.status(200).json({
        success: true,
        message: 'Login successful',
        token: token,
        refreshToken: refreshToken,
        user: {
          _id: user._id,
          fullName: `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.trim() || user.username,
          email: user.email,
          phoneNumber: user.phone,
          emailVerified: user.userMeta?.isEmailVerified || false,
          phoneVerified: user.userMeta?.isPhoneVerified || false,
          profileCompletionStatus: {
            personalInformation: !!(user.personalInfo?.firstName && user.personalInfo?.lastName),
            addressInformation: !!(user.address?.country && user.address?.city),
            identityVerification: !!(user.kycVerification?.documentType && user.kycVerification?.documentNumber)
          }
        }
      });

    } catch (err) {
      console.error('💥 Login Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  sendOtp: async (req, res) => {
    console.log('📧 Send OTP endpoint hit');
    console.log('📝 Request body:', req.body);
    
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email is required',
          errors: [
            { field: 'email', message: 'Email is required' }
          ]
        });
      }
      
      console.log('🔍 Looking for user...');
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      console.log('🎲 Generating OTP...');
      const otp = generateOTP();
      user.userMeta.otp = otp;
      user.userMeta.otpCreatedAt = new Date();
      await user.save();
      
      console.log('📧 Sending email...');
      // Check if EJS template exists
      const templatePath = path.join(__dirname, '../views/otpEmail.ejs');
      let emailHtml;
      
      try {
        emailHtml = await ejs.renderFile(templatePath, {
          otp,
          username: user.username || user.personalInfo?.firstName || 'User',
        });
      } catch (templateError) {
        console.log('⚠️ EJS template not found, using simple HTML');
        emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Your Verification Code</h2>
            <p>Hello ${user.username || user.personalInfo?.firstName || 'User'},</p>
            <p>Your verification code is:</p>
            <h1 style="background-color: #f0f0f0; padding: 20px; text-align: center; letter-spacing: 5px;">${otp}</h1>
            <p>This code will expire in 10 minutes.</p>
            <p>If you didn't request this code, please ignore this email.</p>
          </div>
        `;
      }
      
      const msg = {
        to: user.email,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject: 'Your Verification Code - eBanking',
        html: emailHtml,
      };
      
      await sgMail.send(msg);
      console.log('✅ OTP sent successfully');
      
      res.status(200).json({ 
        success: true, 
        message: 'Verification code sent to your email',
        data: {
          userId: user._id,
          contact: user.email,
          expiresIn: 10
        }
      });
    } catch (err) {
      console.error('💥 Send OTP Error:', err);
      
      if (err.response && err.response.body && err.response.body.errors) {
        console.error('SendGrid Error:', err.response.body.errors);
        return res.status(500).json({
          success: false,
          message: 'Failed to send email. Please check your email configuration.',
          error: 'Email service error'
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  verifyOtp: async (req, res) => {
    console.log('🔍 Verify OTP endpoint hit');
    console.log('📝 Request body:', { ...req.body, otp: req.body.otp ? '[PROVIDED]' : '[MISSING]' });
    
    try {
      const { email, otp, userId, code, type } = req.body;
      const finalOtp = otp || code;
      const finalType = type || 'email';
      
      if ((!email && !userId) || !finalOtp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Email/userId and verification code are required',
          errors: [
            { field: 'email', message: 'Email or userId is required' },
            { field: 'code', message: 'Verification code is required' }
          ]
        });
      }
      
      console.log('🔍 Looking for user...');
      const user = await User.findOne(
        email ? { email } : { _id: userId }
      );
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }
      
      const storedOTP = user.userMeta.otp;
      const otpCreatedAt = user.userMeta.otpCreatedAt;
      
      if (!storedOTP || !otpCreatedAt) {
        return res.status(400).json({ 
          success: false, 
          message: 'No verification code found. Please request a new one.' 
        });
      }
      
      console.log('⏰ Checking OTP expiry...');
      const now = new Date();
      const otpAgeMinutes = (now - otpCreatedAt) / 1000 / 60;
      
      if (otpAgeMinutes > 15) { // Extended to 15 minutes as per documentation
        return res.status(400).json({ 
          success: false, 
          message: 'Verification code has expired. Please request a new one.' 
        });
      }
      
      console.log('🔐 Verifying OTP...');
      if (storedOTP !== finalOtp) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid verification code' 
        });
      }
      
      console.log('✅ OTP verified, updating user...');
      // Clear OTP and mark as verified
      user.userMeta.otp = null;
      user.userMeta.otpCreatedAt = null;
      user.userMeta.isEmailVerified = true;
      await user.save();
      
      console.log('🎉 Email verification completed!');
      
      res.status(200).json({ 
        success: true, 
        message: `${finalType === 'email' ? 'Email' : 'Phone'} verified successfully`,
        data: {
          verifiedAt: new Date().toISOString(),
          type: finalType
        }
      });
    } catch (err) {
      console.error('💥 Verify OTP Error:', err);
      res.status(500).json({ 
        success: false, 
        message: 'Server error', 
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  // Get current user (new endpoint to match documentation)
  getCurrentUser: async (req, res) => {
    try {
      const user = req.user; // From auth middleware
      
      res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          fullName: `${user.personalInfo?.firstName || ''} ${user.personalInfo?.lastName || ''}`.trim() || user.username,
          email: user.email,
          phoneNumber: user.phone,
          emailVerified: user.userMeta?.isEmailVerified || false,
          phoneVerified: user.userMeta?.isPhoneVerified || false,
          profileCompletionStatus: {
            personalInformation: !!(user.personalInfo?.firstName && user.personalInfo?.lastName),
            addressInformation: !!(user.address?.country && user.address?.city),
            identityVerification: !!(user.kycVerification?.documentType && user.kycVerification?.documentNumber)
          }
        }
      });
    } catch (err) {
      console.error('Get Current User Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  },

  // Logout endpoint
  logout: async (req, res) => {
    try {
      const user = req.user; // From auth middleware
      
      // Clear the token
      user.userMeta.token = null;
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (err) {
      console.error('Logout Error:', err);
      res.status(500).json({
        success: false,
        message: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    }
  }
};

module.exports = authCtrl;