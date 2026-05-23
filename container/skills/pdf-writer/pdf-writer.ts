import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

async function generatePdf(inputPath: string, outputPath: string) {
  const browser = await chromium.launch({
    executablePath: process.env.AGENT_BROWSER_EXECUTABLE_PATH || '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    const content = fs.readFileSync(inputPath, 'utf8');
    
    // If it's HTML, set content directly. If it's a file path, go to it.
    if (content.trim().startsWith('<')) {
      await page.setContent(content, { waitUntil: 'networkidle' });
    } else {
      await page.goto(`file://${path.resolve(inputPath)}`, { waitUntil: 'networkidle' });
    }

    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });

    console.log(`PDF successfully generated: ${outputPath}`);
  } catch (error) {
    console.error('Error generating PDF:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

const args = process.argv.slice(2);
if (args.length < 2) {
  console.log('Usage: bun pdf-writer.ts <input_html_or_file> <output_pdf_path>');
  process.exit(1);
}

generatePdf(args[0], args[1]);
