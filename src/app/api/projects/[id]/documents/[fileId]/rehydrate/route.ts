import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * POST /api/projects/[id]/documents/[fileId]/rehydrate
 * Manually triggers text extraction + page rendering for an existing file.
 * Useful for files uploaded before the auto-hydration system was in place.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const { id: project_id, fileId } = await params;

  try {
    const asset = await prisma.fileAsset.findUnique({
      where: { id: fileId }
    });

    if (!asset || asset.project_id !== project_id) {
      return NextResponse.json({ error: 'File not found.' }, { status: 404 });
    }

    const isPdf =
      asset.mime_type === 'application/pdf' ||
      asset.original_filename.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      return NextResponse.json({ error: 'Only PDF files can be rehydrated.' }, { status: 400 });
    }

    // Fire and wait (intentionally await here so the user sees a result)
    const { hydrateDocument } = await import('@/lib/hydrate-document');
    await hydrateDocument(project_id, asset.id, asset.file_storage_path);

    // Return updated asset
    const updated = await prisma.fileAsset.findUnique({ where: { id: fileId } });
    return NextResponse.json({
      success: true,
      message: 'Hydration complete.',
      file_id: fileId,
      has_text: !!updated?.extracted_text_path,
      has_images: !!updated?.rendered_image_path_prefix,
      page_count: updated?.page_count
    });
  } catch (error: any) {
    console.error('[Rehydrate API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
