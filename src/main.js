import { createIcons, icons } from 'lucide';
import confetti from 'canvas-confetti';
import { compressPdf, generatePdfThumbnail, formatBytes } from './compressor.js';
import { createSamplePdf } from './samplePdf.js';

// Initialize all Lucide icons across the DOM
function refreshIcons() {
  createIcons({ icons });
}

// Application State
const state = {
  files: [], // Array of { id, file, thumbnail, pageCount, sizeStr }
  selectedLevel: 'recommended',
  targetSizeEnabled: false,
  targetSizeKb: 500,
  grayscale: false,
  stripMetadata: true,
  engine: 'smart',
  compressedResults: [], // Array of { originalFile, result, blobUrl }
};

// DOM Elements
const views = {
  upload: document.getElementById('uploadView'),
  workspace: document.getElementById('workspaceView'),
  processing: document.getElementById('processingView'),
  results: document.getElementById('resultsView'),
};

const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const btnSelectFiles = document.getElementById('btnSelectFiles');
const btnDeviceUpload = document.getElementById('btnDeviceUpload');
const btnSamplePdf = document.getElementById('btnSamplePdf');
const btnSamplePdfTop = document.getElementById('btnSamplePdfTop');
const fileCardsGrid = document.getElementById('fileCardsGrid');
const fileCountBadge = document.getElementById('fileCountBadge');
const btnAddMoreFiles = document.getElementById('btnAddMoreFiles');
const btnClearAll = document.getElementById('btnClearAll');
const compressionLevels = document.getElementById('compressionLevels');
const btnExecuteCompress = document.getElementById('btnExecuteCompress');

// Advanced Controls
const chkTargetSize = document.getElementById('chkTargetSize');
const targetSizeControls = document.getElementById('targetSizeControls');
const customTargetKb = document.getElementById('customTargetKb');
const targetPresets = document.querySelectorAll('.preset-chip');
const chkGrayscale = document.getElementById('chkGrayscale');
const chkMetadata = document.getElementById('chkMetadata');
const selEngine = document.getElementById('selEngine');

// Processing UI
const progressBarFill = document.getElementById('progressBarFill');
const processStatusText = document.getElementById('processStatusText');
const processPercentText = document.getElementById('processPercentText');
const processHeading = document.getElementById('processHeading');

// Results UI
const savingsPercentDisplay = document.getElementById('savingsPercentDisplay');
const resOriginalSize = document.getElementById('resOriginalSize');
const resCompressedSize = document.getElementById('resCompressedSize');
const barFillCompressed = document.getElementById('barFillCompressed');
const barFillSaved = document.getElementById('barFillSaved');
const barSavedText = document.getElementById('barSavedText');
const btnDownloadCompressed = document.getElementById('btnDownloadCompressed');
const downloadBtnText = document.getElementById('downloadBtnText');
const btnPreviewResult = document.getElementById('btnPreviewResult');
const btnCompressAnother = document.getElementById('btnCompressAnother');

// Modal Elements
const previewModal = document.getElementById('previewModal');
const previewModalTitle = document.getElementById('previewModalTitle');
const previewIframe = document.getElementById('previewIframe');
const btnClosePreviewModal = document.getElementById('btnClosePreviewModal');

// Mobile Navigation Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileNavDrawer = document.getElementById('mobileNavDrawer');
const menuOpenIcon = document.getElementById('menuOpenIcon');
const menuCloseIcon = document.getElementById('menuCloseIcon');
const btnSamplePdfMobile = document.getElementById('btnSamplePdfMobile');
const mobileNavCompress = document.getElementById('mobileNavCompress');
const btnDownloadFromModal = document.getElementById('btnDownloadFromModal');

/**
 * Switch Active View
 */
function switchView(viewName) {
  Object.keys(views).forEach((key) => {
    views[key].classList.toggle('active', key === viewName);
  });
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Handle Adding New PDF Files
 */
async function handleFilesSelected(fileList) {
  const newFiles = Array.from(fileList).filter(
    (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
  );

  if (newFiles.length === 0) {
    alert('Please select valid PDF documents.');
    return;
  }

  // Switch to workspace view immediately
  switchView('workspace');

  for (const file of newFiles) {
    const fileId = 'file_' + Math.random().toString(36).substring(2, 9);
    const fileObj = {
      id: fileId,
      file,
      thumbnail: null,
      pageCount: '...',
      sizeStr: formatBytes(file.size),
    };

    state.files.push(fileObj);
    renderCards();

    // Asynchronously generate first page thumbnail
    generatePdfThumbnail(file).then((meta) => {
      fileObj.thumbnail = meta.thumbnailUrl;
      fileObj.pageCount = meta.pageCount;
      renderCards();
    });
  }

  updateFileSummary();
}

/**
 * Update File Count Badge & Sidebar text
 */
function updateFileSummary() {
  const count = state.files.length;
  if (count === 0) {
    switchView('upload');
    return;
  }

  fileCountBadge.textContent = `${count} ${count === 1 ? 'file' : 'files'}`;
  btnExecuteCompress.querySelector('span').textContent =
    count > 1 ? `Compress ${count} PDFs` : 'Compress PDF';
}

/**
 * Render File Cards in the Workspace
 */
function renderCards() {
  fileCardsGrid.innerHTML = '';

  state.files.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'file-card';
    card.dataset.id = item.id;

    card.innerHTML = `
      <div class="card-thumbnail-wrap">
        ${
          item.thumbnail
            ? `<img src="${item.thumbnail}" class="card-thumbnail-img" alt="${item.file.name}" />`
            : `<div class="card-fallback-icon"><i data-lucide="file-text" style="width: 48px; height: 48px;"></i></div>`
        }
        <span class="card-page-badge">${item.pageCount} ${item.pageCount === 1 ? 'page' : 'pages'}</span>
      </div>
      <div class="card-info">
        <span class="card-filename" title="${item.file.name}">${item.file.name}</span>
        <span class="card-filesize">${item.sizeStr}</span>
      </div>
      <button class="card-delete-btn" data-delete-id="${item.id}" title="Remove file">
        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
      </button>
    `;

    fileCardsGrid.appendChild(card);
  });

  refreshIcons();

  // Attach delete handlers
  fileCardsGrid.querySelectorAll('.card-delete-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.dataset.deleteId;
      state.files = state.files.filter((f) => f.id !== id);
      renderCards();
      updateFileSummary();
    });
  });
}

/**
 * Handle Drop Zone Events
 */
function initDropZone() {
  const triggerPicker = () => fileInput.click();

  btnSelectFiles.addEventListener('click', triggerPicker);
  btnDeviceUpload.addEventListener('click', triggerPicker);
  btnAddMoreFiles.addEventListener('click', triggerPicker);

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelected(e.target.files);
      fileInput.value = '';
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropZone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });
  });

  dropZone.addEventListener('drop', (e) => {
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelected(e.dataTransfer.files);
    }
  });

  // Global drag-and-drop onto the window
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (views.upload.classList.contains('active')) {
      if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFilesSelected(e.dataTransfer.files);
      }
    }
  });
}

/**
 * Handle "Try Sample PDF" Button
 */
async function loadSamplePdf() {
  try {
    const originalText = btnSamplePdf.innerHTML;
    btnSamplePdf.innerHTML = `<span>Generating demo...</span>`;
    btnSamplePdf.disabled = true;

    const sampleFile = await createSamplePdf();
    handleFilesSelected([sampleFile]);

    btnSamplePdf.innerHTML = originalText;
    btnSamplePdf.disabled = false;
    refreshIcons();
  } catch (err) {
    console.error('Failed to create sample PDF:', err);
    btnSamplePdf.disabled = false;
  }
}

/**
 * Setup Compression Level Cards & Advanced Options
 */
function initOptions() {
  // Compression level selection cards
  const cards = compressionLevels.querySelectorAll('.level-card');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      cards.forEach((c) => c.classList.remove('active'));
      card.classList.add('active');
      state.selectedLevel = card.dataset.level;
    });
  });

  // Target size toggle
  chkTargetSize.addEventListener('change', (e) => {
    state.targetSizeEnabled = e.target.checked;
    targetSizeControls.style.display = e.target.checked ? 'flex' : 'none';
  });

  // Target size preset chips
  targetPresets.forEach((chip) => {
    chip.addEventListener('click', () => {
      targetPresets.forEach((c) => c.classList.remove('active'));
      chip.classList.add('active');
      const kb = parseInt(chip.dataset.kb, 10);
      customTargetKb.value = kb;
      state.targetSizeKb = kb;
    });
  });

  customTargetKb.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val > 0) {
      state.targetSizeKb = val;
    }
  });

  // Grayscale toggle
  chkGrayscale.addEventListener('change', (e) => {
    state.grayscale = e.target.checked;
  });

  // Strip metadata toggle
  chkMetadata.addEventListener('change', (e) => {
    state.stripMetadata = e.target.checked;
  });

  // Engine selection
  selEngine.addEventListener('change', (e) => {
    state.engine = e.target.value;
  });

  // Clear all button
  btnClearAll.addEventListener('click', () => {
    if (confirm('Are you sure you want to remove all uploaded PDFs?')) {
      state.files = [];
      renderCards();
      switchView('upload');
    }
  });
}

/**
 * Execute Compression
 */
async function startCompression() {
  if (state.files.length === 0) return;

  // Clean previous blob URLs
  state.compressedResults.forEach((r) => {
    if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
  });
  state.compressedResults = [];

  switchView('processing');
  processHeading.textContent =
    state.files.length > 1 ? `Compressing ${state.files.length} PDFs...` : 'Compressing PDF...';

  const totalFiles = state.files.length;
  let overallOriginalBytes = 0;
  let overallCompressedBytes = 0;

  for (let i = 0; i < totalFiles; i++) {
    const { file } = state.files[i];

    const result = await compressPdf(
      file,
      {
        level: state.selectedLevel,
        targetSizeKb: state.targetSizeEnabled ? state.targetSizeKb : null,
        grayscale: state.grayscale,
        stripMetadata: state.stripMetadata,
        engine: state.engine,
      },
      ({ stage, percent }) => {
        const fileWeight = 100 / totalFiles;
        const currentTotalPercent = Math.round(i * fileWeight + (percent / 100) * fileWeight);

        progressBarFill.style.width = `${currentTotalPercent}%`;
        processPercentText.textContent = `${currentTotalPercent}%`;
        processStatusText.textContent =
          totalFiles > 1 ? `[File ${i + 1}/${totalFiles}] ${stage}` : stage;
      }
    );

    const blobUrl = URL.createObjectURL(result.compressedBlob);
    state.compressedResults.push({
      originalFile: file,
      result,
      blobUrl,
    });

    overallOriginalBytes += result.originalBytes;
    overallCompressedBytes += result.compressedBytes;
  }

  // Trigger celebration confetti
  confetti({
    particleCount: 120,
    spread: 75,
    origin: { y: 0.6 },
    colors: ['#e5322d', '#ff524d', '#10b981', '#3b82f6', '#f59e0b'],
  });

  // Populate Results Screen
  const totalSavedBytes = Math.max(0, overallOriginalBytes - overallCompressedBytes);
  const totalSavedPercent =
    overallOriginalBytes > 0 ? Math.round((totalSavedBytes / overallOriginalBytes) * 100) : 0;

  savingsPercentDisplay.textContent = `${totalSavedPercent}% smaller!`;
  resOriginalSize.textContent = formatBytes(overallOriginalBytes);
  resCompressedSize.textContent = formatBytes(overallCompressedBytes);

  const compressedBarRatio = Math.max(
    10,
    Math.round((overallCompressedBytes / overallOriginalBytes) * 100)
  );
  barFillCompressed.style.width = `${compressedBarRatio}%`;
  barFillSaved.style.width = `${100 - compressedBarRatio}%`;
  barSavedText.textContent = `Saved: ${formatBytes(totalSavedBytes)}`;

  if (state.compressedResults.length > 1) {
    downloadBtnText.textContent = `Download All (${state.compressedResults.length} PDFs)`;
  } else {
    downloadBtnText.textContent = 'Download compressed PDF';
  }

  switchView('results');
}

/**
 * Trigger File Downloads
 */
function downloadResults() {
  if (state.compressedResults.length === 0) return;

  state.compressedResults.forEach(({ originalFile, blobUrl }) => {
    const a = document.createElement('a');
    a.href = blobUrl;
    const baseName = originalFile.name.replace(/\.pdf$/i, '');
    a.download = `${baseName}_compressed.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });
}

/**
 * Preview Modal Handlers
 */
function openPreviewModal() {
  if (state.compressedResults.length === 0) return;
  const firstResult = state.compressedResults[0];

  previewModalTitle.textContent = `${firstResult.originalFile.name} (Compressed)`;
  previewIframe.src = firstResult.blobUrl;
  previewModal.style.display = 'flex';
}

function closePreviewModal() {
  previewModal.style.display = 'none';
  previewIframe.src = 'about:blank';
}

/**
 * Initialize FAQ Accordion
 */
function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  faqItems.forEach((item) => {
    const questionBtn = item.querySelector('.faq-question');
    questionBtn.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      faqItems.forEach((f) => f.classList.remove('open'));
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });
}

/**
 * Initialize Mobile Navigation Menu
 */
function initMobileMenu() {
  if (!mobileMenuBtn || !mobileNavDrawer) return;

  const toggleMenu = (forceClose = false) => {
    const shouldOpen = forceClose ? false : !mobileNavDrawer.classList.contains('open');
    mobileNavDrawer.classList.toggle('open', shouldOpen);
    mobileMenuBtn.setAttribute('aria-expanded', shouldOpen ? 'true' : 'false');
    
    if (menuOpenIcon && menuCloseIcon) {
      menuOpenIcon.style.display = shouldOpen ? 'none' : 'block';
      menuCloseIcon.style.display = shouldOpen ? 'block' : 'none';
    }
    
    // Prevent background scrolling while mobile drawer is open
    document.body.style.overflow = shouldOpen ? 'hidden' : '';
  };

  mobileMenuBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  // Close when tapping backdrop
  mobileNavDrawer.addEventListener('click', (e) => {
    if (e.target === mobileNavDrawer) {
      toggleMenu(true);
    }
  });

  // Close on menu link tap
  const navItems = mobileNavDrawer.querySelectorAll('.mobile-nav-item');
  navItems.forEach((link) => {
    link.addEventListener('click', () => {
      toggleMenu(true);
    });
  });

  // Mobile sample PDF button
  if (btnSamplePdfMobile) {
    btnSamplePdfMobile.addEventListener('click', () => {
      toggleMenu(true);
      loadSamplePdf();
    });
  }

  // Mobile compress logo/nav reset
  if (mobileNavCompress) {
    mobileNavCompress.addEventListener('click', (e) => {
      e.preventDefault();
      toggleMenu(true);
      resetApp();
    });
  }
}

/**
 * Reset App to Initial Upload State
 */
function resetApp() {
  state.files = [];
  state.compressedResults.forEach((r) => {
    if (r.blobUrl) URL.revokeObjectURL(r.blobUrl);
  });
  state.compressedResults = [];
  renderCards();
  switchView('upload');
}

// Initial Wire-Up
document.addEventListener('DOMContentLoaded', () => {
  refreshIcons();
  initDropZone();
  initOptions();
  initFaq();
  initMobileMenu();

  // Button Listeners
  btnSamplePdf.addEventListener('click', loadSamplePdf);
  btnSamplePdfTop.addEventListener('click', loadSamplePdf);
  btnExecuteCompress.addEventListener('click', startCompression);
  btnDownloadCompressed.addEventListener('click', downloadResults);
  btnPreviewResult.addEventListener('click', openPreviewModal);
  btnCompressAnother.addEventListener('click', resetApp);
  document.getElementById('brandLogo').addEventListener('click', (e) => {
    e.preventDefault();
    resetApp();
  });

  // Modal Listeners
  btnClosePreviewModal.addEventListener('click', closePreviewModal);
  btnDownloadFromModal.addEventListener('click', downloadResults);
  previewModal.addEventListener('click', (e) => {
    if (e.target === previewModal) closePreviewModal();
  });
});
