const jwt = require('jsonwebtoken');
require('dotenv').config();


exports.identifier = (req, res, next) => {
  let token = req.headers.authorization || req.cookies['Authorization'];

  if (!token) {
    return res.status(403).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized: Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const { userId, role } = decoded || {};

    if (!userId || !role) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Token missing required fields' });
    }

    if (!['instructor', 'student', 'admin'].includes(role)) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid role' });
    }

    // Role-specific ID attachment
    req.user = decoded;
    req[`${role}Id`] = userId;

    // Enforce role for admin routes
    if (req.path.startsWith('/admin') && role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized: Admin access only' });
    }

    next();

  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};
