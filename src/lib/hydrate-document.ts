import path from 'path';
import fs from 'fs/promises';
import { prisma } from '@/lib/prisma';
import { extractTextFromPdf, renderPdfPages } from '@/lib/document-processor';

/**
 * Orchestrates full document hydration for a single file asset.
 * Extracts text + renders page images, then updates the FileAsset record in the DB.
 * 
 * This is designed to be called fire-and-forget after upload (via .then().catch()).
 * It does NOT block the upload API response.
 */
export async function hydrateDocument(
  project_id: string,
  file_id: string,
  file_storage_path: string // relative to storage root, e.g. "project_X/filename.pdf"
): Promise<void> {
  console.log(`[Hydrate] Starting hydration for file ${file_id} (${file_storage_path})`);

  const storageRoot = path.join(process.cwd(), 'storage');
  const absolutePdfPath = path.join(storageRoot, file_storage_path);

  // Confirm the file actually exists on disk before proceeding
  try {
    await fs.access(absolutePdfPath);
  } catch {
    console.error(`[Hydrate] File not found on disk: ${absolutePdfPath}`);
    return;
  }

  const updateData: any = {};

  // ── 1. Extract Text ──────────────────────────────────────────────
  try {
    const extractedText = await extractTextFromPdf(absolutePdfPath);

    if (extractedText && extractedText.trim().length > 20) {
      // Save text to disk
      const textDir = path.join(storageRoot, `project_${project_id}`, 'text');
      await fs.mkdir(textDir, { recursive: true });
      const textFilePath = path.join(textDir, `${file_id}.txt`);
      await fs.writeFile(textFilePath, extractedText, 'utf8');

      // Store relative path
      const relTextPath = `project_${project_id}/text/${file_id}.txt`;
      updateData.extracted_text_path = relTextPath;
      console.log(`[Hydrate] Text extracted: ${extractedText.length} chars → ${relTextPath}`);
    } else {
      console.log(`[Hydrate] No text layer detected (likely scanned). Skipping text extraction.`);
    }
  } catch (err) {
    console.error(`[Hydrate] Text extraction error for ${file_id}:`, err);
  }

  // ── 2. Render Page Images ────────────────────────────────────────
  try {
    const renderedDir = path.join(storageRoot, `project_${project_id}`, 'rendered', file_id);
    const imagePrefix = 'page';

    const { paths, page_count } = await renderPdfPages(absolutePdfPath, renderedDir, imagePrefix);

    if (paths.length > 0) {
      // Store prefix to reconstruct URLs in the context endpoint
      // e.g., "project_X/rendered/FILE_ID/page"
      const relPrefix = `project_${project_id}/rendered/${file_id}/${imagePrefix}`;
      updateData.rendered_image_path_prefix = relPrefix;
      updateData.page_count = page_count;
      console.log(`[Hydrate] Rendered ${page_count} pages → prefix: ${relPrefix}`);
    } else {
      console.warn(`[Hydrate] Page rendering produced no output for ${file_id}`);
    }
  } catch (err) {
    console.error(`[Hydrate] Page rendering error for ${file_id}:`, err);
  }

  // ── 3. Update DB ─────────────────────────────────────────────────
  if (Object.keys(updateData).length > 0) {
    try {
      await prisma.fileAsset.update({
        where: { id: file_id },
        data: updateData
      });
      console.log(`[Hydrate] DB updated for file ${file_id}:`, Object.keys(updateData));
    } catch (err) {
      console.error(`[Hydrate] DB update failed for ${file_id}:`, err);
    }
  } else {
    console.warn(`[Hydrate] Nothing to update in DB for ${file_id} — both text and image extraction may have failed.`);
  }
}
