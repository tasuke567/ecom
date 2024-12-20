const express = require('express');
const router = express.Router();
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { OAuth2Client } = require('google-auth-library');
const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
},
  async (accessToken, refreshToken, profile, done) => {
    try {
      // Check if user exists
      let user = await User.findOne({ email: profile.emails[0].value });

      if (!user) {
        // Create new user if doesn't exist
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleId: profile.id
        });
      }

      return done(null, user);
    } catch (error) {
      return done(error, null);
    }
  }
));
// Google login route
router.post('/google', async (req, res) => {
  try {
    console.log('Starting Google authentication...');
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        success: false,
        message: 'Credential is required'
      });
    }
    // Log Client ID for debugging
    console.log('Using Client ID:', process.env.GOOGLE_CLIENT_ID);

    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID.trim() // เพิ่ม trim() เพื่อลบช่องว่าง
      });
      const payload = ticket.getPayload();
      console.log('Token verified successfully');
      // Find or create user
      let user = await User.findOne({ email: payload.email });
      if (!user) {
        user = await User.create({
          name: payload.name,
          email: payload.email,
          googleId: payload.sub,
          avatar: payload.picture,
          isGoogleUser: true
        });
      }
      // Generate JWT
      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      return res.status(200).json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar
        },
        token
      });
    } catch (verifyError) {
      console.error('Token verification error:', {
        message: verifyError.message,
        expected: process.env.GOOGLE_CLIENT_ID,
        received: credential.aud
      });

      return res.status(401).json({
        success: false,
        message: 'Invalid Google token',
        error: verifyError.message
      });
    }
  } catch (error) {
    console.error('Google authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
});




  router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Check if user exists
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const user = new User({
      username,
      email,
      password: hashedPassword
    });

    await user.save();

    res.status(201).json({ message: 'Registration successful' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});


router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        message: 'Invalid email or password'
      });
    }

    // Create user data to send back (exclude password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email
    };

    res.status(200).json({
      message: 'Login successful',
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

module.exports = router;