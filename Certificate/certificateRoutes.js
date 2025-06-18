const express = require("express");
const router = express.Router();
const { generateCertificateHandler } = require("./certificateController");

router.post("/certificate/generate-certificate", generateCertificateHandler);

module.exports = router;
