const generateCertificatePDF = require('./certificateGenerator');
const path = require('path');

async function generateCertificateHandler(req, res) {
  try {
    const data = req.body;

    if (!data || !data.studentName || !data.courseTitle) {
      return res.status(400).json({ error: 'Invalid certificate data' });
    }

    const fileName = `certificate-${data.studentName.replace(/\s+/g, '_')}-${Date.now()}.pdf`;
    const outputDir = path.resolve(__dirname, '../Certificates');
    const outputPath = path.join(outputDir, fileName);

    await generateCertificatePDF(data, outputPath);

    // 📦 Set appropriate headers to force download or preview
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(outputPath);
  } catch (error) {
    console.error('❌ Error generating certificate PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}

module.exports = { generateCertificateHandler };
