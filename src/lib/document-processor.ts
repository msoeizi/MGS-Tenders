import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';

/**
 * Renders all pages of a PDF to high-res PNG images using pdftoppm.
 * Assumes poppler-utils is installed on the server.
 */
export async function generatePageImages(project_id: string, file_id: string, file_storage_path: string) {
  const fullPath = path.resolve(process.cwd(), 'storage', file_storage_path);
  const outputDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'rendered', file_id);
  
  await fs.mkdir(outputDir, { recursive: true });

  try {
    console.log(`[DocumentProcessor] Rendering PDF to images: ${fullPath}`);
    
    // Use pdftoppm (poppler-utils) - fast and high quality
    // -png: output PNG
    // -r 300: 300 DPI for high quality
    // outputDir/page: prefix for output files like page-1.png, page-2.png etc.
    const cmd = `pdftoppm -png -r 150 "${fullPath}" "${path.join(outputDir, 'page')}"`;
    execSync(cmd);

    // List the files to count pages
    const files = await fs.readdir(outputDir);
    const pageCount = files.filter(f => f.startsWith('page-') && f.endsWith('.png')).length;

    return { 
      pageCount, 
      outputDirPrefix: `project_${project_id}/rendered/${file_id}/` 
    };
  } catch (error) {
    console.error('[DocumentProcessor] Error generating page images:', error);
    // Fallback or rethrow
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
  // pdftoppm outputs with zero-padding usually, or just page-1.png
  // Actually pdftoppm usually does page-1.png, page-01.png etc depending on page count.
  // Standard pdftoppm: page-1.png
  const paddedPage = pageNumber.toString();
  const fullPagePath = path.join(
    process.cwd(), 
    'storage', 
    `project_${project_id}`, 
    'rendered', 
    file_id, 
    `page-${paddedPage}.png`
  );

  const snapshotDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'snapshots');
  await fs.mkdir(snapshotDir, { recursive: true });
  
  const snapshotFileName = `evidence_${evidence_id.replace(/[^a-z0-9]/gi, '_')}.png`;
  const snapshotPath = path.join(snapshotDir, snapshotFileName);

  try {
    if (!(await fs.stat(fullPagePath).catch(() => false))) {
      console.warn(`[DocumentProcessor] Source page image not found: ${fullPagePath}`);
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

    // Expand crop by 10% for better context
    const paddingX = Math.round(width * 0.1);
    const paddingY = Math.round(height * 0.1);
    
    const finalLeft = Math.max(0, left - paddingX);
    const finalTop = Math.max(0, top - paddingY);
    const finalWidth = Math.min(metadata.width - finalLeft, width + (paddingX * 2));
    const finalHeight = Math.min(metadata.height - finalTop, height + (paddingY * 2));

    await image
      .extract({ left: finalLeft, top: finalTop, width: finalWidth, height: finalHeight })
      .resize(800) // Resize to a decent width for popover
      .toFile(snapshotPath);

    return `/api/storage/project_${project_id}/snapshots/${snapshotFileName}`;
  } catch (error) {
    console.error('[DocumentProcessor] Error generating snapshot:', error);
    return null;
  }
}
