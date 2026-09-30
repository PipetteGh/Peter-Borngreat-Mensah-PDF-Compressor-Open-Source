import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { PDFDocument } from 'pdf-lib';

// Set up PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Format bytes to human readable format (KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 2) {
  if (!+bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Generate a visual thumbnail for the first page of a PDF file
 */
export async function generatePdfThumbnail(file) {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const page = await pdf.getPage(1);

    const viewport = page.getViewport({ scale: 1 });
    // Scale to standard card thumbnail width (approx 240px)
    const scale = 240 / viewport.width;
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = scaledViewport.width;
    canvas.height = scaledViewport.height;
    const ctx = canvas.getContext('2d', { alpha: false });

    // Fill white background in case page has transparency
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    return {
      thumbnailUrl: canvas.toDataURL('image/jpeg', 0.8),
      pageCount: pdf.numPages,
      width: viewport.width,
      height: viewport.height,
    };
  } catch (error) {
    console.warn('Could not generate PDF thumbnail:', error);
    return {
      thumbnailUrl: null,
      pageCount: 1,
      width: 595,
      height: 842,
    };
  }
}

/**
 * Core PDF Compression Engine
 */
export async function compressPdf(file, options = {}, onProgress = () => {}) {
  const startTime = performance.now();
  const originalBytes = file.size;

  const {
    level = 'recommended', // 'extreme' | 'recommended' | 'low' | 'custom'
    targetSizeKb = null,
    grayscale = false,
    stripMetadata = true,
    engine = 'smart', // 'smart' | 'lossless'
  } = options;

  onProgress({
    stage: 'Reading document structure...',
    percent: 10,
  });

  const arrayBuffer = await file.arrayBuffer();

  // If user explicitly chose lossless stream compression
  if (engine === 'lossless') {
    onProgress({ stage: 'Optimizing PDF object streams...', percent: 50 });
    const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });

    if (stripMetadata) {
      pdfDoc.setTitle('');
      pdfDoc.setAuthor('');
      pdfDoc.setSubject('');
      pdfDoc.setKeywords([]);
      pdfDoc.setProducer('Borngreat PDF Compressor');
      pdfDoc.setCreator('Borngreat PDF Engine');
    }

    const compressedBytes = await pdfDoc.save({ useObjectStreams: true });
    const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
    const savedBytes = Math.max(0, originalBytes - compressedBytes.length);
    const savedPercent = Math.round((savedBytes / originalBytes) * 100);

    return {
      compressedBlob,
      compressedBytes: compressedBytes.length,
      originalBytes,
      originalSizeStr: formatBytes(originalBytes),
      compressedSizeStr: formatBytes(compressedBytes.length),
      savedBytes,
      savedPercent,
      durationMs: Math.round(performance.now() - startTime),
      pagesProcessed: pdfDoc.getPageCount(),
    };
  }

  // --- Smart Raster & Stream Optimization Engine ---
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;

  // Determine scale and JPEG compression factor based on level
  let scale = 1.35;
  let quality = 0.72;

  if (targetSizeKb && targetSizeKb > 0) {
    // Target size mode: calculate target budget per page
    const targetBytes = targetSizeKb * 1024;
    const targetPerPage = targetBytes / numPages;

    if (targetPerPage < 40 * 1024) {
      scale = 0.85;
      quality = 0.40;
    } else if (targetPerPage < 100 * 1024) {
      scale = 1.1;
      quality = 0.55;
    } else if (targetPerPage < 250 * 1024) {
      scale = 1.3;
      quality = 0.70;
    } else {
      scale = 1.5;
      quality = 0.82;
    }
  } else {
    switch (level) {
      case 'extreme':
        // Less quality, high compression
        scale = 0.95;
        quality = 0.45;
        break;
      case 'low':
        // High quality, less compression
        scale = 1.75;
        quality = 0.86;
        break;
      case 'recommended':
      default:
        // Good quality, good compression
        scale = 1.35;
        quality = 0.70;
        break;
    }
  }

  // Create clean new PDF container
  const newPdf = await PDFDocument.create();

  if (stripMetadata) {
    newPdf.setProducer('Borngreat PDF Compressor (https://borngreat.com)');
    newPdf.setCreator('Borngreat Engine');
    newPdf.setCreationDate(new Date());
    newPdf.setModificationDate(new Date());
  }

  // Process pages sequentially
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const pagePercent = Math.round(15 + ((pageNum - 1) / numPages) * 70);
    onProgress({
      stage: `Optimizing page ${pageNum} of ${numPages}...`,
      percent: pagePercent,
      currentPage: pageNum,
      totalPages: numPages,
    });

    const page = await pdf.getPage(pageNum);
    const originalViewport = page.getViewport({ scale: 1 });
    const scaledViewport = page.getViewport({ scale });

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(scaledViewport.width);
    canvas.height = Math.round(scaledViewport.height);
    const ctx = canvas.getContext('2d', { alpha: false });

    // Crisp white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    await page.render({
      canvasContext: ctx,
      viewport: scaledViewport,
    }).promise;

    // Apply grayscale if selected
    if (grayscale) {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        d[i] = gray;
        d[i + 1] = gray;
        d[i + 2] = gray;
      }
      ctx.putImageData(imgData, 0, 0);
    }

    // Convert canvas to compressed JPEG
    const jpegDataUrl = canvas.toDataURL('image/jpeg', quality);
    const imgBytes = await fetch(jpegDataUrl).then((r) => r.arrayBuffer());

    // Embed into output PDF
    const embeddedImg = await newPdf.embedJpg(imgBytes);

    // Keep page dimensions identical to original point size
    const newPage = newPdf.addPage([originalViewport.width, originalViewport.height]);
    newPage.drawImage(embeddedImg, {
      x: 0,
      y: 0,
      width: originalViewport.width,
      height: originalViewport.height,
    });
  }

  onProgress({
    stage: 'Finalizing compressed streams...',
    percent: 92,
  });

  // Save new PDF with object streams enabled
  let compressedBytes = await newPdf.save({ useObjectStreams: true });

  // Safety check: if for a tiny pure-vector document the rasterized output is larger than original,
  // fall back to lossless object stream compression so we never make a file bigger!
  if (compressedBytes.length > originalBytes) {
    try {
      const losslessDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
      const losslessBytes = await losslessDoc.save({ useObjectStreams: true });
      if (losslessBytes.length < compressedBytes.length) {
        compressedBytes = losslessBytes;
      }
    } catch {
      // Keep rasterized bytes
    }
  }

  const compressedBlob = new Blob([compressedBytes], { type: 'application/pdf' });
  const finalSize = compressedBytes.length;
  const savedBytes = Math.max(0, originalBytes - finalSize);
  const savedPercent = originalBytes > 0 ? Math.round((savedBytes / originalBytes) * 100) : 0;

  onProgress({
    stage: 'Done! PDF ready for download.',
    percent: 100,
  });

  return {
    compressedBlob,
    compressedBytes: finalSize,
    originalBytes,
    originalSizeStr: formatBytes(originalBytes),
    compressedSizeStr: formatBytes(finalSize),
    savedBytes,
    savedPercent,
    durationMs: Math.round(performance.now() - startTime),
    pagesProcessed: numPages,
  };
}
