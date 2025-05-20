const jwt = require('jsonwebtoken');
require('dotenv').config();

exports.identifier = (req, res, next) => {
  let token = req.headers.authorization || req.cookies['Authorization'];

  if (!token) {
    return res.status(403).json({ success: false, message: 'Unauthorized: No token provided' });
  }

  // Remove Bearer prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.split(' ')[1];
  } else {
    return res.status(403).json({ success: false, message: 'Unauthorized: Invalid token format' });
  }

  try {
    const jwtVerified = jwt.verify(token, process.env.TOKEN_SECRET);

    if (!jwtVerified || !jwtVerified.userId || !jwtVerified.role) {
      return res.status(403).json({ success: false, message: 'Unauthorized: Token missing fields' });
    }

    // Inject common user object
    req.user = jwtVerified;

    // Role-based ID assignment
    switch (jwtVerified.role) {
      case 'instructor':
        req.instructorId = jwtVerified.userId;
        break;
      case 'student':
        req.studentId = jwtVerified.userId;
        break;
      case 'recruiter':
        req.recruiterId = jwtVerified.userId;
        break;
      case 'admin':
        req.adminId = jwtVerified.userId;
        break;
      default:
        return res.status(403).json({ success: false, message: 'Unauthorized: Invalid role' });
    }

    next(); // proceed to controller

  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(403).json({ success: false, message: 'Unauthorized: Invalid or expired token' });
  }
};
