import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Prepare documents context
    const documents = project.fileAssets.map(file => ({
      document_id: file.id,
      document_title: file.original_filename,
      extracted_text: file.extracted_text_path ? "Text extraction available on request" : null, // Placeholder or actual text
      page_map: null, // Placeholder for future enhancement
      page_image_urls: file.rendered_image_path_prefix ? [`${file.rendered_image_path_prefix}_page_1.jpg`] : [],
      upload_phase: "initial"
    }));

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
