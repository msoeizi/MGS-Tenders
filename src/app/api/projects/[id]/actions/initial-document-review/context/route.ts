import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';
import { logApiCommunication } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: {
        fileAssets: true
      }
    });

    if (!project) {
      return NextResponse.json({ error: `Project not found: ${project_id}` }, { status: 404 });
    }

    // 1. Determine the base URL dynamically from the request headers
    const host = req.headers.get('host') || 'localhost:3232';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const baseUrl = `${protocol}://${host}`;

    // 2. Build document context for each file asset
    const documents = await Promise.all(project.fileAssets.map(async (file: any) => {
      const rawPath = String(file.file_storage_path);
      const file_download_url = `${baseUrl}/api/storage/${rawPath.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`;

      // ── Read extracted text from disk ──
      let extracted_text: string | null = null;
      if (file.extracted_text_path) {
        try {
          // extracted_text_path is stored relative to storage root
          const fullTextPath = path.join(process.cwd(), 'storage', file.extracted_text_path);
          if (fs.existsSync(fullTextPath)) {
            extracted_text = fs.readFileSync(fullTextPath, 'utf8');
          }
        } catch (err) {
          console.warn(`Could not read extracted text for ${file.id}:`, err);
        }
      }

      // ── Build page image URLs from rendered files on disk ──
      let page_image_urls: string[] = [];
      if (file.rendered_image_path_prefix) {
        try {
          // prefix = "project_X/rendered/FILE_ID/page"
          // actual files = "project_X/rendered/FILE_ID/page-1.jpg", etc.
          const renderedDir = path.join(process.cwd(), 'storage', path.dirname(file.rendered_image_path_prefix));
          const prefix = path.basename(file.rendered_image_path_prefix);
          if (fs.existsSync(renderedDir)) {
            const dirFiles = fs.readdirSync(renderedDir);
            const pageFiles = dirFiles
              .filter((f: string) => f.startsWith(prefix) && (f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png') || f.endsWith('.ppm')))
              .sort();
            page_image_urls = pageFiles.map((f: string) => {
              const relPath = `${path.dirname(file.rendered_image_path_prefix)}/${f}`;
              return `${baseUrl}/api/storage/${relPath.split('/').map((s: string) => encodeURIComponent(s)).join('/')}`;
            });
          }
        } catch (err) {
          console.warn(`Could not enumerate rendered pages for ${file.id}:`, err);
        }
      }

      // ── Determine document_access_status ──
      const hasText = !!(extracted_text && extracted_text.trim().length > 20);
      const hasImages = page_image_urls.length > 0;
      const absoluteFilePath = path.join(process.cwd(), 'storage', rawPath);
      const hasFileOnDisk = fs.existsSync(absoluteFilePath);
      const hydrationAttempted = !!(file.extracted_text_path || file.rendered_image_path_prefix);

      let document_access_status: string;
      let document_access_error: string | null = null;

      if (hasText && hasImages) {
        document_access_status = 'ready';
      } else if (hasText && !hasImages) {
        document_access_status = 'text_only';
        document_access_error = 'Page images were not rendered. Text is available for analysis.';
      } else if (!hasText && hasImages) {
        document_access_status = 'images_only';
        document_access_error = 'No text layer detected (likely a scanned drawing). Analyze visually using page_image_urls.';
      } else if (hasFileOnDisk && !hydrationAttempted) {
        document_access_status = 'processing';
        document_access_error = 'Document is on server but has not been processed yet. Please retry in a few moments.';
      } else if (!hasFileOnDisk) {
        document_access_status = 'inaccessible';
        document_access_error = 'File not found on server disk.';
      } else {
        document_access_status = 'failed';
        document_access_error = 'Hydration was attempted but produced no usable output.';
      }

      const page_count = file.page_count || page_image_urls.length || null;
      const page_map = page_count ? { total_pages: page_count } : null;

      return {
        document_id: file.id,
        document_title: file.original_filename,
        document_access_status,
        document_access_error,
        file_download_url,
        extracted_text: hasText
          ? extracted_text
          : `[SYSTEM NOTE: No text layer extracted. document_access_status="${document_access_status}". ${document_access_error || ''} Use page_image_urls for visual analysis if available.]`,
        page_map,
        page_image_urls,
        upload_phase: file.upload_batch_id || 'initial'
      };
    }));

    const response = {
      project_id: project.id,
      project_title: project.project_title,
      project_description: project.project_description,
      documents,
      system_defaults: {
        base_address: '47 Geraldton Crescent, North York, Ontario',
        labor_rates: {
          designer: 180,
          project_manager: 120,
          general_labor: 95
        }
      }
    };

    // LOG COMMUNICATION
    await logApiCommunication(
      project.id,
      '/actions/initial-document-review/context',
      'GET',
      null,
      response,
      200
    );

    return NextResponse.json(response, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (error: any) {
    console.error('Context Endpoint Error:', error);
    
    if (project_id) {
      await logApiCommunication(
        project_id,
        '/actions/initial-document-review/context',
        'GET',
        null,
        { error: error.message },
        500
      );
    }

    return NextResponse.json(
      { error: error.message }, 
      { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      }
    );
  }
}
