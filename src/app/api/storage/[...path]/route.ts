import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  let segments = pathSegments;
  
  // 1. Handle cases where 'storage' is redundantly included in the URL
  if (segments[0] === 'storage') {
    segments = segments.slice(1);
  }

  const relativePath = segments.join('/');
  
  // 2. Security: Prevent directory traversal
  if (relativePath.includes('..') || relativePath.startsWith('/') || relativePath.startsWith('\\')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }

  // 3. Define possible storage locations (Persistent vs Legacy Public)
  const storageRoot = path.join(process.cwd(), 'storage');
  const publicStorageRoot = path.join(process.cwd(), 'public', 'storage');
  
  let filePath = path.join(storageRoot, relativePath);

  // 4. Fallback to public storage if not found in root storage
  if (!fs.existsSync(filePath)) {
    filePath = path.join(publicStorageRoot, relativePath);
  }

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
