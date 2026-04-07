import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';

/**
 * Extracts the full text layer from a PDF using pdfjs-dist.
 * Returns an empty string if the PDF has no text layer (scanned).
 */
export async function extractTextFromPdf(absolutePdfPath: string): Promise<string> {
  try {
    // Dynamic import required — pdfjs-dist uses ESM internals
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs' as any);
    const loadingTask = pdfjsLib.getDocument({ url: `file://${absolutePdfPath}`, useSystemFonts: true });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pageTexts: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(`--- Page ${i} ---\n${pageText}`);
    }

    return pageTexts.join('\n\n');
  } catch (err) {
    console.warn('[DocumentProcessor] extractTextFromPdf failed:', err);
    return '';
  }
}

/**
 * Renders each page of a PDF as a JPEG image using pdftoppm.
 * Returns an array of relative storage paths (relative to process.cwd()/storage).
 */
export async function renderPdfPages(
  absolutePdfPath: string,
  outputDir: string,
  prefix: string
): Promise<{ paths: string[], page_count: number }> {
  try {
    await fs.mkdir(outputDir, { recursive: true });
    const outputPrefix = path.join(outputDir, prefix);
    const renderCmd = `pdftoppm -jpeg -r 150 "${absolutePdfPath}" "${outputPrefix}"`;
    execSync(renderCmd, { timeout: 120000 });

    const files = await fs.readdir(outputDir);
    const rendered = files
      .filter(f => f.startsWith(prefix) && (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.ppm')))
      .sort();

    // Build paths relative to the storage root (process.cwd()/storage)
    const storageRoot = path.join(process.cwd(), 'storage');
    const relativePaths = rendered.map(f => {
      const abs = path.join(outputDir, f);
      return abs.replace(storageRoot + path.sep, '').replace(/\\/g, '/');
    });

    return { paths: relativePaths, page_count: rendered.length };
  } catch (err) {
    console.warn('[DocumentProcessor] renderPdfPages failed:', err);
    return { paths: [], page_count: 0 };
  }
}

/**
 * Creates a zoomed-in snapshot of a specific region of a page on-demand.
 * It renders only the required page from the source PDF, then crops it.
 * 
 * @param project_id Project ID
 * @param file_id File Asset ID
 * @param storagePath Relative path to the source PDF within the storage directory
 * @param pageNumber 1-indexed page number
 * @param boundingBox [ymin, xmin, ymax, xmax] in normalized coordinates (0-1)
 * @param evidence_id Unique ID or Label for the evidence record
 */
export async function generateSnapshot(
  project_id: string,
  file_id: string,
  storagePath: string,
  pageNumber: number,
  boundingBox: number[],
  evidence_id: string
) {
  const fullSourcePath = path.resolve(process.cwd(), 'storage', storagePath);
  const assetDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'rendered', file_id);
  const fullPagePath = path.join(assetDir, `page-${pageNumber}.png`);

  const snapshotDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'snapshots');
  await fs.mkdir(snapshotDir, { recursive: true });
  
  const snapshotFileName = `evidence_${evidence_id.replace(/[^a-z0-9]/gi, '_')}.png`;
  const snapshotPath = path.join(snapshotDir, snapshotFileName);

  try {
    // 1. Render specific page if it doesn't already exist in the 'rendered' cache
    if (!(await fs.stat(fullPagePath).catch(() => false))) {
      await fs.mkdir(assetDir, { recursive: true });
      console.log(`[DocumentProcessor] On-demand rendering page ${pageNumber} of PDF: ${fullSourcePath}`);
      
      // -f N -l N renders ONLY page N. 
      // We use a temporary prefix to avoid collisions during the render process.
      const tempPrefix = path.join(assetDir, `temp_render_${evidence_id.replace(/[^a-z0-9]/gi, '_')}`);
      const renderCmd = `pdftoppm -png -r 150 -f ${pageNumber} -l ${pageNumber} "${fullSourcePath}" "${tempPrefix}"`;
      execSync(renderCmd);
      
      // pdftoppm appends '-1.png' (or -N.png) to the prefix.
      const files = await fs.readdir(assetDir);
      const outputName = files.find(f => f.startsWith(path.basename(tempPrefix)) && f.endsWith('.png'));
      
      if (outputName) {
        await fs.rename(path.join(assetDir, outputName), fullPagePath);
      } else {
        throw new Error(`Failed to find rendered output for page ${pageNumber}`);
      }
    }

    // 2. Perform the crop using Sharp
    const image = sharp(fullPagePath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) throw new Error('Could not read image metadata');

    const [ymin, xmin, ymax, xmax] = boundingBox;
    
    // Convert normalized coordinates to pixel coordinates
    const left = Math.round(xmin * metadata.width);
    const top = Math.round(ymin * metadata.height);
    const width = Math.round((xmax - xmin) * metadata.width);
    const height = Math.round((ymax - ymin) * metadata.height);

    // Expand crop area by 10% for visual context
    const paddingX = Math.round(width * 0.1);
    const paddingY = Math.round(height * 0.1);
    
    const finalLeft = Math.max(0, left - paddingX);
    const finalTop = Math.max(0, top - paddingY);
    const finalWidth = Math.min(metadata.width - finalLeft, width + (paddingX * 2));
    const finalHeight = Math.min(metadata.height - finalTop, height + (paddingY * 2));

    await image
      .extract({ 
        left: finalLeft, 
        top: finalTop, 
        width: Math.max(1, finalWidth), 
        height: Math.max(1, finalHeight) 
      })
      .resize(800, null, { withoutEnlargement: true }) // Standardized width for UI
      .toFile(snapshotPath);

    return `/api/storage/project_${project_id}/snapshots/${snapshotFileName}`;
  } catch (error) {
    console.error('[DocumentProcessor] Error generating on-demand snapshot:', error);
    return null;
  }
}
