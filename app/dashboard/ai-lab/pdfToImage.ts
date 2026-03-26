/**
 * Client-side PDF to Image converter
 * Uses installed pdfjs-dist
 */

import * as pdfjsLib from 'pdfjs-dist';

// Configure worker — use local copy in /public to avoid CDN/network issues
pdfjsLib.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;

// Vercel serverless has a hard 4.5MB request body limit.
// Base64 strings must stay well under that threshold.
const VERCEL_SAFE_BASE64_SIZE = 3.5 * 1024 * 1024; // 3.5 MB (leave headroom for action metadata)

export async function convertPdfPageToImage(
  file: File,
  pageNumber: number = 1,
  scale: number = 3.5 // High resolution for detailed document recognition (ES-Intelligence v2.1 vision)
): Promise<string> {
  // Read file as ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();

  // Load PDF document
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
  });
  const pdf = await loadingTask.promise;

  // Validate page number
  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number. PDF has ${pdf.numPages} pages.`);
  }

  // Get specified page
  const page = await pdf.getPage(pageNumber);

  // Set scale
  const viewport = page.getViewport({ scale });

  // Create canvas
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Failed to get canvas context");
  }

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  // Render PDF page to canvas
  const renderContext = {
    canvasContext: context,
    viewport: viewport,
    canvas: canvas, // Required by RenderParameters type
  };

  await page.render(renderContext).promise;

  // Convert canvas to base64 JPEG — start at 0.88 quality for better symbol clarity
  let quality = 0.88;
  let imageBase64 = canvas.toDataURL("image/jpeg", quality);

  // If base64 exceeds safe limit, progressively lower quality (but not below 0.60 to preserve details)
  while (imageBase64.length > VERCEL_SAFE_BASE64_SIZE && quality > 0.60) {
    quality -= 0.08;
    imageBase64 = canvas.toDataURL("image/jpeg", quality);
  }

  // If still too large after compression, re-render at lower scale
  if (imageBase64.length > VERCEL_SAFE_BASE64_SIZE) {
    const smallerScale = scale * 0.65;
    const smallViewport = page.getViewport({ scale: smallerScale });
    canvas.width = smallViewport.width;
    canvas.height = smallViewport.height;
    await page.render({
      canvasContext: context,
      viewport: smallViewport,
      canvas: canvas,
    }).promise;
    imageBase64 = canvas.toDataURL("image/jpeg", 0.68);
  }

  // Clean up
  canvas.remove();

  return imageBase64;
}

/**
 * Render one PDF page and split into tiles (e.g. 4×4 for A1 / large format).
 * Each tile is sent at full resolution so the model can count densely packed symbols.
 * Order: left-to-right, top-to-bottom.
 */
export async function convertPdfPageToTiles(
  file: File,
  pageNumber: number = 1,
  gridCols: number = 4,
  gridRows: number = 4,
  renderScale: number = 3.5 // Higher resolution for tile-based analysis (dense A1 blueprints)
): Promise<string[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  if (pageNumber < 1 || pageNumber > pdf.numPages) {
    throw new Error(`Invalid page number. PDF has ${pdf.numPages} pages.`);
  }
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: renderScale });
  const fullWidth = viewport.width;
  const fullHeight = viewport.height;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Failed to get canvas context");
  canvas.width = fullWidth;
  canvas.height = fullHeight;

  const renderContext = {
    canvasContext: ctx,
    viewport,
    canvas,
  };
  await page.render(renderContext).promise;

  const tileWidth = fullWidth / gridCols;
  const tileHeight = fullHeight / gridRows;
  const tiles: string[] = [];

  for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
      const tCanvas = document.createElement("canvas");
      tCanvas.width = tileWidth;
      tCanvas.height = tileHeight;
      const tCtx = tCanvas.getContext("2d");
      if (!tCtx) continue;
      tCtx.drawImage(
        canvas,
        col * tileWidth,
        row * tileHeight,
        tileWidth,
        tileHeight,
        0,
        0,
        tileWidth,
        tileHeight
      );
      tiles.push(tCanvas.toDataURL("image/jpeg", 0.92));
      tCanvas.remove();
    }
  }
  canvas.remove();
  return tiles;
}

export async function getPdfPageCount(file: File): Promise<number> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({
    data: arrayBuffer,
  });
  const pdf = await loadingTask.promise;

  return pdf.numPages;
}
