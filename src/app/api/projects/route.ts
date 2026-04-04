import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = formData.get('title') as string;
    const address = formData.get('address') as string;
    const files = formData.getAll('files') as File[];

    // 1. Create project record
    const project = await prisma.project.create({
      data: {
        project_title: title || 'Untitled Project',
        project_address: address || 'No Address Provided',
        project_status: 'Draft',
      }
    });

    const project_id = project.id;
    const uploadDir = path.join(process.cwd(), 'storage', `project_${project_id}`);
    await fs.mkdir(uploadDir, { recursive: true });

    // 2. Save files and prepare FileAsset data
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const filePath = path.join(uploadDir, fileName);
      
      await fs.writeFile(filePath, buffer);

      await prisma.fileAsset.create({
        data: {
          project_id,
          original_filename: fileName,
          file_storage_path: `project_${project_id}/${fileName}`,
          mime_type: file.type,
          source_interface: 'WebApp',
          is_active: true
        }
      });
    }

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
