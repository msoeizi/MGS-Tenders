import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  
  // 1. Construct the relative path from the segments
  const relativePath = pathSegments.join('/');
  
  // 2. Security: Prevent directory traversal
  if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // 3. Define the physical storage root (project root/storage)
  const storageRoot = path.join(process.cwd(), 'storage');
  const filePath = path.join(storageRoot, relativePath);

  // 4. Check if file exists
  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    // 5. Read file and determine content type
    const fileBuffer = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    
    let contentType = 'application/octet-stream';
    if (ext === '.pdf') contentType = 'application/pdf';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.txt') contentType = 'text/plain';

    // 6. Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${path.basename(filePath)}"`,
      },
    });
  } catch (error: any) {
    console.error('File Serving Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
