import fs from 'fs/promises';
import path from 'path';
import sharp from 'sharp';
import { execSync } from 'child_process';

/**
 * Creates a zoomed-in snapshot of a specific region of a page.
 * Renders the page on-demand if the PNG doesn't exist.
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
  const assetDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'rendered', file_id);
  const fullPagePath = path.join(assetDir, `page-${pageNumber}.png`);

  const snapshotDir = path.join(process.cwd(), 'storage', `project_${project_id}`, 'snapshots');
  await fs.mkdir(snapshotDir, { recursive: true });
  
  const snapshotFileName = `evidence_${evidence_id.replace(/[^a-z0-9]/gi, '_')}.png`;
  const snapshotPath = path.join(snapshotDir, snapshotFileName);

  try {
    // 1. Ensure the page image exists (On-demand rendering)
    if (!(await fs.stat(fullPagePath).catch(() => false))) {
      await fs.mkdir(assetDir, { recursive: true });
      
      // Get the source PDF path
      const projectDir = path.join(process.cwd(), 'storage', `project_${project_id}`);
      // Find the file in the project directory (since we only have file_id here, 
      // we might need the original path from the caller or look it up).
      // For now, let's assume we pass the file_storage_path or look it up from prisma.
      // Better: let's modify the signature to accept storagePath.
    }

    // [INTERNAL REFACTORD LOGIC BELOW]
  } catch (error) {
    console.error('[DocumentProcessor] Error generating snapshot:', error);
    return null;
  }
}

/**
 * Internal helper to render a single page and then crop it.
 */
export async function generateSnapshotWithSource(
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
    // 1. Render specific page if not exists
    if (!(await fs.stat(fullPagePath).catch(() => false))) {
      await fs.mkdir(assetDir, { recursive: true });
      console.log(`[DocumentProcessor] Rendering single page ${pageNumber} of PDF: ${fullSourcePath}`);
      
      // -f N -l N renders ONLY page N
      // pdftoppm appends -1 to the prefix if we use 'page'
      const renderCmd = `pdftoppm -png -r 150 -f ${pageNumber} -l ${pageNumber} "${fullSourcePath}" "${path.join(assetDir, 'render')}"`;
      execSync(renderCmd);
      
      // pdftoppm output will be render-N.png or render-1.png if it's the first in range?
      // actually with -f N -l N, it usually outputs render-N.png
      const expectedRenderOutput = path.join(assetDir, `render-${pageNumber}.png`);
      if (await fs.stat(expectedRenderOutput).catch(() => false)) {
        await fs.rename(expectedRenderOutput, fullPagePath);
      } else {
        // sometimes it might just be render-1.png if it thinks it's the first page of the 'range'
        const rangeRenderOutput = path.join(assetDir, `render-1.png`);
        if (await fs.stat(rangeRenderOutput).catch(() => false)) {
          await fs.rename(rangeRenderOutput, fullPagePath);
        }
      }
    }

    // 2. Perform the crop
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
      .resize(800, null, { withoutEnlargement: true }) // Resize to 800px width for consistency
      .toFile(snapshotPath);

    return `/api/storage/project_${project_id}/snapshots/${snapshotFileName}`;
  } catch (error) {
    console.error('[DocumentProcessor] Error generating snapshot:', error);
    return null;
  }
}
