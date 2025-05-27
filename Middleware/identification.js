const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.identifier = (req, res, next) => {
  let token = req.headers.authorization || req.cookies['Authorization'];

  if (!token) {
    return res.status(403).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  // Remove "Bearer " prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized: Invalid token format' });
  }

  try {
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (!decoded?.userId || !decoded?.role) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Token missing required fields' });
    }

    // Attach user info
    req.user = decoded;

    // Role-specific ID assignment
    if (decoded.role === 'instructor') {
      req.instructorId = decoded.userId;
    } else if (decoded.role === 'student') {
      req.studentId = decoded.userId;
    } else if (decoded.role === 'admin') {
      req.adminId = decoded.userId;
    } else {
      return res.status(403).json({ success: false, message: 'Unauthorized: Invalid role' });
    }

    next(); // Proceed to controller

  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};
