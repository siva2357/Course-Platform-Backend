const generateCertificatePDF = require('./certificateGenerator');
const path = require('path');

async function generateCertificateHandler(req, res) {
  try {
    const data = req.body; // Assuming JSON body parser is used
    
    if (!data) {
      return res.status(400).json({ error: 'No data provided' });
    }
    await generateCertificatePDF(data);
    const pdfPath = path.resolve('./certificate.pdf');
    res.sendFile(pdfPath);
  } catch (error) {
    console.error('Error generating certificate PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

module.exports = { generateCertificateHandler };
