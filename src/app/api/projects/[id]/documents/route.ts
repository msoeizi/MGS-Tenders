import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    
    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'storage', `project_${project_id}`);
    await fs.mkdir(uploadDir, { recursive: true });

    const createdAssets = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = file.name;
      const filePath = path.join(uploadDir, fileName);
      
      // Save file to disk
      await fs.writeFile(filePath, buffer);

      // Create record in DB
      const asset = await prisma.fileAsset.create({
        data: {
          project_id,
          original_filename: fileName,
          file_storage_path: `project_${project_id}/${fileName}`, // Relative to 'storage' root
          file_size_bytes: BigInt(file.size),
          mime_type: file.type,
          source_interface: 'WebApp',
          is_active: true
        }
      });
      createdAssets.push(asset);

      // Trigger asynchronous PDF-to-Image rendering
      if (file.type === 'application/pdf') {
        const { generatePageImages } = await import('@/lib/document-processor');
        generatePageImages(project_id, asset.id, asset.file_storage_path)
          .catch(err => console.error(`[Upload] Rendering error for ${asset.id}:`, err));
      }
    }

    return NextResponse.json({ success: true, assets: createdAssets.map(a => ({...a, file_size_bytes: a.file_size_bytes.toString()})) });
  } catch (error: any) {
    console.error('Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
