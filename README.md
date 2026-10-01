# Borngreat PDF Compressor 📄⚡

> **Same PDF quality, less file size.** A modern, high-performance, client-side PDF compressor.

Borngreat PDF Compressor developed by Peter Borngreat-Mensah allows users to upload any PDF document, customize the compression profile or target file size, and instantly produce an optimized, lightweight PDF directly within their browser without sending a single byte to an external server.

---

## 🌟 Key Features

- **Inspired UX**:
  - Central drag-and-drop upload zone with large, intuitive call-to-actions.
  - Multi-file batch support with real-time page count, size display, and visual thumbnails rendered via PDF.js.
  - Real-time compression progress tracker with stage updates ("Optimizing page X of Y", "Quantizing streams").
  - Post-compression celebration screen with savings breakdown (e.g., **87% smaller!**), comparison bars, and download buttons.
  - In-app interactive PDF Preview modal to inspect results prior to downloading.

- **Dual-Engine Compression Architecture**:
  1. **Smart Resampling & Stream Packing**:
     - Automatically optimizes high-resolution embedded images and scanned pages using adaptive DPI scaling and discrete cosine transform quantization.
     - Saves with cross-reference object stream compaction (`useObjectStreams`).
  2. **Lossless Structural Optimization**:
     - Compacts PDF object trees and strips redundant metadata streams while preserving 100% of native vector graphics and fonts.

- **3 Tailored Compression Profiles**:
  - **Extreme Compression**: Maximum size reduction. Ideal for strict email attachment limits and job/university portals (< 1 MB).
  - **Recommended Compression** *(Default)*: Optimal balance between crystal-clear text readability and high compression ratio (~50-85% size drop).
  - **Less Compression**: Subtle compression designed for high-resolution presentations and professional printing.

- **Advanced Controls**:
  - **Target File Size Limit**: Set a hard size cap (e.g. Under 300 KB, Under 500 KB, Under 1 MB, Under 2 MB, or custom KB).
  - **Grayscale Conversion**: Convert full-color pages to grayscale for an extra 20–35% size reduction.
  - **Strip Metadata**: Remove author, software tags, and edit history for privacy.

- **100% Client-Side Privacy**:
  - Operates completely in-memory inside the browser sandbox using WebAssembly and JavaScript.
  - Zero server uploads, zero logs, zero file storage risks.

- **Built-in 1-Click Demo Document**:
  - Includes a "Try Sample PDF" feature that generates an in-memory high-resolution report to test compression instantly without needing a local PDF file.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Local Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```
The optimized production bundle will be created in the `dist/` directory.

---

## 🛠️ Technology Stack

- **HTML5 & Semantic Structure**: Accessible markup following modern web guidelines.
- **Vanilla CSS**: Bespoke design system utilizing CSS variables, fluid responsive grids, glassmorphism, and micro-animations (no TailwindCSS dependencies).
- **JavaScript (ES Modules)**: Native ES modules bundled with Vite.
- **PDF Engines**:
  - [`pdf-lib`](https://pdf-lib.js.org/): Stream compression, object packing, page composition, and metadata management.
  - [`pdfjs-dist`](https://mozilla.github.io/pdf.js/): PDF page parsing, thumbnail rendering, and high-fidelity raster extraction.
- **Icons & Effects**:
  - [`lucide`](https://lucide.dev/): Modern SVG iconography.
  - [`canvas-confetti`](https://www.npmjs.com/package/canvas-confetti): Interactive post-compression celebration effects.

---

## 🔒 Privacy & Security Guarantee

All document processing occurs entirely in the client's browser memory. Your documents are never transmitted over the internet or uploaded to any third-party server.
