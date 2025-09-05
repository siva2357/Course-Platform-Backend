const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,          // ✅ use 587 instead of 465
  secure: false,      // ✅ must be false for STARTTLS
  auth: {
    user: process.env.NODE_CODE_SENDING_EMAIL_ADDRESS,
    pass: process.env.NODE_CODE_SENDING_EMAIL_PASSWORD, // should be an App Password if 2FA enabled
  },
});

module.exports = transport;
