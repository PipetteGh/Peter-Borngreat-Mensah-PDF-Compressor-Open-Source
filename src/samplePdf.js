import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates an in-memory sample PDF containing high-resolution raster images,
 * colored headers, text blocks, and vector drawings.
 * This allows users to immediately test the Borngreat PDF Compressor
 * without needing an existing PDF on their machine.
 */
export async function createSamplePdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // Helper to generate a colorful synthetic high-res image canvas as JPEG
  function generateHighResCanvas(width, height, title, colorScheme) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    // Gradient background
    const grad = ctx.createLinearGradient(0, 0, width, height);
    if (colorScheme === 'sunset') {
      grad.addColorStop(0, '#ff416c');
      grad.addColorStop(0.5, '#ff4b2b');
      grad.addColorStop(1, '#ff9068');
    } else {
      grad.addColorStop(0, '#2b5876');
      grad.addColorStop(0.5, '#4e4376');
      grad.addColorStop(1, '#00c6ff');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);

    // Decorative geometric textures (increases raw byte size to showcase compression)
    for (let i = 0; i < 60; i++) {
      ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + (i % 5) * 0.04})`;
      ctx.beginPath();
      const radius = 30 + (i * 12) % 180;
      const x = (i * 97) % width;
      const y = (i * 131) % height;
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // High detail noise pattern to create realistic image entropy
    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 16) {
      const noise = (Math.random() - 0.5) * 20;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }
    ctx.putImageData(imgData, 0, 0);

    // Center badge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.roundRect(width * 0.15, height * 0.35, width * 0.7, height * 0.3, 20);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(width * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, width / 2, height / 2 - 20);

    ctx.font = `${Math.round(width * 0.025)}px sans-serif`;
    ctx.fillStyle = '#f0f0f0';
    ctx.fillText('Borngreat High-Resolution Embedded Graphic • 300 DPI Test', width / 2, height / 2 + 30);

    return canvas.toDataURL('image/jpeg', 0.98);
  }

  // --- PAGE 1: Annual Marketing Report with High-Res Hero Image ---
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4
  const { width: p1W, height: p1H } = page1.getSize();

  // Top header bar
  page1.drawRectangle({
    x: 0,
    y: p1H - 80,
    width: p1W,
    height: 80,
    color: rgb(0.12, 0.15, 0.20),
  });

  page1.drawText('BORNGREAT TECH CORP', {
    x: 40,
    y: p1H - 45,
    size: 20,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('ANNUAL DIGITAL TRANSFORMATION REPORT', {
    x: 40,
    y: p1H - 65,
    size: 11,
    font: helveticaFont,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Body text
  page1.drawText('Executive Summary & Strategic Overview', {
    x: 40,
    y: p1H - 120,
    size: 16,
    font: helveticaBold,
    color: rgb(0.9, 0.2, 0.2),
  });

  const p1Intro = 
    'This demonstration document simulates real-world enterprise PDF reports with high-resolution imagery,\n' +
    'uncompressed metadata streams, and visual assets. Large PDFs typically suffer from unoptimized\n' +
    'raster textures and uncompressed cross-reference streams. Borngreat PDF Compressor intelligently\n' +
    'downsamples image DPI, applies smart discrete cosine transform quantizers, and strips redundant\n' +
    'bloat while preserving human-perceived visual clarity and layout precision.';

  page1.drawText(p1Intro, {
    x: 40,
    y: p1H - 150,
    size: 10,
    lineHeight: 15,
    font: helveticaFont,
    color: rgb(0.25, 0.25, 0.25),
  });

  // Embed High-Res Canvas 1
  const img1DataUrl = generateHighResCanvas(1400, 850, 'Q4 Global Performance Asset', 'sunset');
  const img1Bytes = await fetch(img1DataUrl).then(res => res.arrayBuffer());
  const embeddedImg1 = await pdfDoc.embedJpg(img1Bytes);

  page1.drawImage(embeddedImg1, {
    x: 40,
    y: p1H - 510,
    width: p1W - 80,
    height: 320,
  });

  // Bottom text callout
  page1.drawRectangle({
    x: 40,
    y: 60,
    width: p1W - 80,
    height: 60,
    color: rgb(0.95, 0.96, 0.98),
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
  });

  page1.drawText('CONFIDENTIAL & PROPRIETARY — FOR EVALUATION PURPOSES ONLY', {
    x: 60,
    y: 85,
    size: 9,
    font: helveticaBold,
    color: rgb(0.4, 0.4, 0.4),
  });

  // --- PAGE 2: Technical Specifications & Scanned Chart Asset ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  const { width: p2W, height: p2H } = page2.getSize();

  // Header
  page2.drawText('Technical Architecture & Benchmark Metrics', {
    x: 40,
    y: p2H - 60,
    size: 18,
    font: helveticaBold,
    color: rgb(0.12, 0.15, 0.20),
  });

  page2.drawText('Page 2 — Document Infrastructure & Scalability Assessment', {
    x: 40,
    y: p2H - 80,
    size: 10,
    font: helveticaFont,
    color: rgb(0.5, 0.5, 0.5),
  });

  // Embed High-Res Canvas 2
  const img2DataUrl = generateHighResCanvas(1200, 750, 'System Throughput & Compression Ratios', 'ocean');
  const img2Bytes = await fetch(img2DataUrl).then(res => res.arrayBuffer());
  const embeddedImg2 = await pdfDoc.embedJpg(img2Bytes);

  page2.drawImage(embeddedImg2, {
    x: 40,
    y: p2H - 420,
    width: p2W - 80,
    height: 310,
  });

  // Table summary
  const tableTop = p2H - 460;
  page2.drawText('Compression Profile Reference Table:', {
    x: 40,
    y: tableTop,
    size: 12,
    font: helveticaBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  const specs = [
    'Profile: Extreme Compression    | Target: Web & Email (< 1 MB)  | Expected Reduction: ~70-90%',
    'Profile: Recommended (Default)  | Target: Daily Business Docs   | Expected Reduction: ~50-75%',
    'Profile: Less Compression       | Target: High Quality Print    | Expected Reduction: ~25-45%',
    'Engine: Borngreat Client Engine  | Privacy: 100% In-Browser     | Upload: Zero Bytes Sent'
  ];

  specs.forEach((line, idx) => {
    page2.drawText(line, {
      x: 40,
      y: tableTop - 25 - (idx * 20),
      size: 9.5,
      font: helveticaFont,
      color: rgb(0.3, 0.35, 0.4),
    });
  });

  // Add rich metadata to test stripping
  pdfDoc.setTitle('Borngreat Sample Document with High-Res Media');
  pdfDoc.setAuthor('Borngreat Systems Engineering');
  pdfDoc.setSubject('PDF Compression Benchmark');
  pdfDoc.setProducer('Borngreat Sample Engine v2.0');
  pdfDoc.setCreationDate(new Date('2026-01-15'));

  const pdfBytes = await pdfDoc.save();
  return new File([pdfBytes], 'Borngreat_Sample_Report.pdf', { type: 'application/pdf' });
}
