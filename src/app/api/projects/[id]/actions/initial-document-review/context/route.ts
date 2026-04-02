import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs';
import path from 'path';

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

    // Prepare documents context
    const documents = project.fileAssets.map((file: any) => {
      let extracted_text: string | null = null;
      if (file.extracted_text_path) {
        try {
          // Assume path is relative to project root
          const fullPath = path.resolve(process.cwd(), file.extracted_text_path);
          if (fs.existsSync(fullPath)) {
            extracted_text = fs.readFileSync(fullPath, 'utf8');
          }
        } catch (err) {
          console.warn(`Could not read extracted text for ${file.id}:`, err);
        }
      }

      // Generate best-effort page image URLs (if prefix exists)
      const page_image_urls = file.rendered_image_path_prefix 
        ? [1, 2, 3].map(p => `${file.rendered_image_path_prefix}_page_${p}.jpg`) // Placeholder for first 3 pages
        : [];

      return {
        document_id: file.id,
        document_title: file.original_filename,
        extracted_text: extracted_text,
        page_map: null, // Placeholder as per logic (return null if not pre-generated)
        page_image_urls: page_image_urls,
        upload_phase: file.upload_batch_id || "initial"
      };
    });

    const response = {
      project_id: project.id,
      documents,
      system_defaults: {
        base_address: "47 Geraldton Crescent, North York, Ontario",
        labor_rates: {
          designer: 180,
          project_manager: 120,
          general_labor: 95
        }
      }
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Context Endpoint Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
