import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';
// For App Router, body size limits are typically handled by the platform (e.g. Vercel) 
// or the underlying server (Nginx). We'll assume the code is correct.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const title = (formData.get('title') as string) || 'Untitled Project';
    const address = (formData.get('address') as string) || 'No Address Provided';
    const files = formData.getAll('files');

    console.log(`[API Projects] Creating project: "${title}" with ${files.length} files.`);

    // 1. Create project record
    const project = await prisma.project.create({
      data: {
        project_title: title,
        project_address: address,
        project_status: 'Draft',
      }
    });

    const project_id = project.id;
    const storageRoot = path.join(process.cwd(), 'storage');
    const uploadDir = path.join(storageRoot, `project_${project_id}`);
    
    // Ensure root and project-specific directories exist
    if (!existsSync(storageRoot)) {
        await fs.mkdir(storageRoot, { recursive: true });
    }
    await fs.mkdir(uploadDir, { recursive: true });

    // 2. Save files and prepare FileAsset data
    for (const fileItem of files) {
      if (!(fileItem instanceof File)) {
          console.warn(`[API Projects] Non-File object received in "files":`, fileItem);
          continue;
      }

      try {
        const buffer = Buffer.from(await fileItem.arrayBuffer());
        const fileName = fileItem.name;
        const filePath = path.join(uploadDir, fileName);
        
        await fs.writeFile(filePath, buffer);

        await prisma.fileAsset.create({
          data: {
            project_id,
            original_filename: fileName,
            file_storage_path: `project_${project_id}/${fileName}`,
            file_size_bytes: BigInt(fileItem.size),
            mime_type: fileItem.type || 'application/octet-stream',
            source_interface: 'WebApp',
            is_active: true
          }
        });
      } catch (fileErr) {
          console.error(`[API Projects] Error saving file "${fileItem.name}":`, fileErr);
      }
    }

    return NextResponse.json(project);
  } catch (error: any) {
    console.error('[API Projects] Fatal Creation Error:', error);
    return NextResponse.json({ 
        error: error.message || 'Internal server error during project creation',
        trace: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
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
