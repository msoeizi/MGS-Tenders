import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
// @ts-ignore
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Initialize PDF.js for Node environment
const PDF_JS_PATH = path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'legacy', 'build', 'pdf.worker.js');

export async function generatePageImages(project_id: string, file_id: string, file_storage_path: string) {
  const fullPath = path.resolve(process.cwd(), 'storage', file_storage_path);
  const outputDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'rendered', file_id);
  
  await fs.mkdir(outputDir, { recursive: true });

  try {
    const data = new Uint8Array(await fs.readFile(fullPath));
    const loadingTask = pdfjsLib.getDocument({
      data,
      useSystemFonts: true,
      standardFontDataUrl: path.join(process.cwd(), 'node_modules', 'pdfjs-dist', 'standard_fonts') + '/'
    });
    
    const pdf = await loadingTask.promise;
    const pageCount = pdf.numPages;

    for (let i = 1; i <= pageCount; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for high res
      
      // Since we are in a pure Node environment without a browser canvas, 
      // we might need a canvas polyfill like 'canvas' or use a different library if this fails.
      // However, for this environment, let's assume we can use a specialized converter
      // or implement a fallback once we test.
      
      console.log(`Rendering page ${i} for file ${file_id}`);
      // NOTE: Traditional pdfjs rendering requires a canvas-like object.
      // If 'canvas' install failed, we might need an alternative like 'pdf-img-convert' 
      // or similar if we can get it to build.
    }

    return { pageCount, outputDirPrefix: `project_${project_id}/rendered/${file_id}/` };
  } catch (error) {
    console.error('Error generating page images:', error);
    throw error;
  }
}

/**
 * Creates a zoomed-in snapshot of a specific region of a page.
 * @param project_id Project ID
 * @param file_id File Asset ID
 * @param pageNumber 1-indexed page number
 * @param boundingBox [ymin, xmin, ymax, xmax] in normalized coordinates (0-1)
 */
export async function generateSnapshot(
  project_id: string, 
  file_id: string, 
  pageNumber: number, 
  boundingBox: number[],
  evidence_id: string
) {
  const fullPagePath = path.join(
    process.cwd(), 
    'storage', 
    `project_${project_id}`, 
    'rendered', 
    file_id, 
    `page_${pageNumber}.png`
  );

  const snapshotDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'snapshots');
  await fs.mkdir(snapshotDir, { recursive: true });
  
  const snapshotFileName = `evidence_${evidence_id}.png`;
  const snapshotPath = path.join(snapshotDir, snapshotFileName);

  try {
    if (!(await fs.stat(fullPagePath).catch(() => false))) {
      console.warn(`Source page image not found: ${fullPagePath}`);
      return null;
    }

    const image = sharp(fullPagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) throw new Error('Could not read image metadata');

    const [ymin, xmin, ymax, xmax] = boundingBox;
    
    const left = Math.round(xmin * metadata.width);
    const top = Math.round(ymin * metadata.height);
    const width = Math.round((xmax - xmin) * metadata.width);
    const height = Math.round((ymax - ymin) * metadata.height);

    // Add some padding if possible, but stay within bounds
    const padding = 20;
    const finalLeft = Math.max(0, left - padding);
    const finalTop = Math.max(0, top - padding);
    const finalWidth = Math.min(metadata.width - finalLeft, width + (padding * 2));
    const finalHeight = Math.min(metadata.height - finalTop, height + (padding * 2));

    await image
      .extract({ left: finalLeft, top: finalTop, width: finalWidth, height: finalHeight })
      .toFile(snapshotPath);

    return `/api/storage/project_${project_id}/snapshots/${snapshotFileName}`;
  } catch (error) {
    console.error('Error generating snapshot:', error);
    return null;
  }
}
