const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware to protect private routes with JWT
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Bearer token in Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Access token is missing'
    });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch user details from database excluding password
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized: User account no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('JWT Authentication error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Not authorized: Invalid or expired token'
    });
  }
};

/**
 * Middleware to restrict access to admin users only
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Forbidden: Admin access required for this action'
  });
};

module.exports = {
  protect,
  adminOnly
};
