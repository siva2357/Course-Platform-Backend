const express = require("express");
const router = express.Router();

const {
  generateCertificateHandler,
} = require("../Certificate/certificateController");

// 🔹 Route to generate certificate PDF (if needed from backend)
router.post("/certificate/generate-certificate", generateCertificateHandler);


// certificateRoutes.js


module.exports = router;
