import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  
  // 1. Join segments and normalize
  let relativePath = pathSegments.join('/');
  
  // 2. Be extremely aggressive about removing leading 'storage/' segments
  // to prevent double concatenation if the DB path already includes it.
  while (relativePath.startsWith('storage/')) {
    relativePath = relativePath.substring(8);
  }
  while (relativePath.startsWith('/')) {
    relativePath = relativePath.substring(1);
  }
  
  // Also strip any instances of 'storage/' from the middle of the path if they exist
  // sometimes placeholder paths might be like 'storage/pending/file.pdf' which becomes 'pending/file.pdf'
  // but if the relativePath is 'storage/pending/file.pdf' after joining segments, we handle it.
  
  // 3. Define all possible root locations to check
  const cwd = process.cwd();
  const rootsToTry = [
    path.join(cwd, 'storage'),           // Root storage
    path.join(cwd, 'public', 'storage'),  // Legacy public storage
    cwd                                   // Root (in case path is absolute/full)
  ];

  let filePath = '';
  let found = false;

  for (const root of rootsToTry) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate) && fs.lstatSync(candidate).isFile()) {
      filePath = candidate;
      found = true;
      break;
    }
  }

  // 4. Final check with better error message
  if (!found) {
    const triedPaths = rootsToTry.map(r => path.join(r, relativePath)).join('\n');
    console.error(`File not found: ${relativePath}. Tried:\n${triedPaths}`);
    return new NextResponse(
      `File not found: ${relativePath}. \n\nChecked locations:\n${triedPaths}`,
      { status: 404 }
    );
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
