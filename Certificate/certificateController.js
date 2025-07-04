const path = require('path');
const generateCertificatePDF = require('./certificateGenerator');

// 🔹 (Optional) Generate PDF on backend
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

    // 📦 Set headers to force inline PDF view
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
    res.sendFile(outputPath);
  } catch (error) {
    console.error('❌ Error generating certificate PDF:', error);
    res.status(500).json({ error: 'Failed to generate PDF' });
  }
}





module.exports = {
  generateCertificateHandler,
};
