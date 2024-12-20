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
    console.log('Starting Google login process');
    console.log('Request body:', req.body);
    
    const { credential } = req.body;
    
    if (!credential) {
      console.log('No credential provided');
      return res.status(400).json({ message: 'Google credential is required' });
    }
     // Verify token
   console.log('Verifying Google token');
   const ticket = await client.verifyIdToken({
     idToken: credential,
     audience: process.env.GOOGLE_CLIENT_ID
   });
    const payload = ticket.getPayload();
   const { email, name, picture, sub: googleId } = payload;
    // Find or create user
   let user = await User.findOne({ email });
    if (!user) {
     // Create new user
     user = await User.create({
       email,
       name,
       googleId,
       avatar: picture,
       isGoogleUser: true
     });
   } else {
     // Update existing user's Google info
     user.googleId = googleId;
     user.avatar = picture;
     user.isGoogleUser = true;
     await user.save();
   }
    // Create JWT token
   const token = jwt.sign(
     { userId: user._id },
     process.env.JWT_SECRET,
     { expiresIn: '24h' }
   );
    // Return user data and token
   res.status(200).json({
     message: 'Google login successful',
     user: {
       id: user._id,
       name: user.name,
       email: user.email,
       avatar: user.avatar
     },
     token
   });
  } catch (error) {
   console.error('Google login error:', error);
   res.status(500).json({
     message: 'Google login failed',
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