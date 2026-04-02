import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { title, address, files } = await req.json();

    const project = await prisma.project.create({
      data: {
        project_title: title || 'Untitled Project',
        project_address: address || 'No Address Provided',
        project_status: 'Draft',
        // Create initial FileAsset records if file names are provided
        fileAssets: {
          create: (files || []).map((fileName: string) => ({
            original_filename: fileName,
            file_storage_path: `storage/pending/${fileName}`, // Placeholder path
            is_active: true,
            source_interface: 'WebApp'
          }))
        }
      }
    });

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('Project Creation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const projects = await prisma.project.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        _count: {
          select: { fileAssets: true }
        }
      }
    });
    return NextResponse.json(projects);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
