const fs = require('fs');
const puppeteer = require('puppeteer');
const ejs = require('ejs');

const templatePath = './templates/certificate.ejs';
const outputPdfPath = './certificate.pdf';  // output PDF filename
const isLandscape = true;

async function generateCertificatePDF(data) {
  // Read EJS template from file
  const templateHtml = fs.readFileSync(templatePath, 'utf8');

  // Render the HTML by injecting data object
  const finalHtml = ejs.render(templateHtml, data);

  // Launch Puppeteer browser
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();

  // Set page content as the rendered HTML
  await page.setContent(finalHtml, { waitUntil: ['load', 'networkidle0', 'domcontentloaded'] });

  // Generate PDF with options
  await page.pdf({
    path: outputPdfPath,
    format: 'a4',
    landscape: isLandscape,
    printBackground: true,
  });

  await browser.close();
  console.log(`PDF generated: ${outputPdfPath}`);
}

module.exports = generateCertificatePDF;
