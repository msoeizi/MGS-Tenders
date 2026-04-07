import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, Range, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    }
  });
}

export async function HEAD(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const relativePath = pathSegments.join('/');
  
  const cwd = process.cwd();
  const rootsToTry = [
    path.join(cwd, 'storage'),
    path.join(cwd, 'public', 'storage'),
    cwd
  ];

  let filePath = null;
  for (const root of rootsToTry) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      filePath = candidate;
      break;
    }
  }

  if (!filePath) {
    return new NextResponse(null, { status: 404 });
  }

  const stats = fs.statSync(filePath);
  const contentType = getContentType(filePath);

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Length': stats.size.toString(),
      'Accept-Ranges': 'bytes',
      'Access-Control-Allow-Origin': '*',
    },
  });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: pathSegments } = await params;
  const relativePath = pathSegments.join('/');
  
  console.log(`[Storage API] Request for: ${relativePath}`);
  console.log(`[Storage API] User-Agent: ${req.headers.get('user-agent')}`);

  const cwd = process.cwd();
  const rootsToTry = [
    path.join(cwd, 'storage'),
    path.join(cwd, 'public', 'storage'),
    cwd
  ];

  let filePath = null;
  for (const root of rootsToTry) {
    const candidate = path.join(root, relativePath);
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      filePath = candidate;
      break;
    }
  }

  if (!filePath) {
    console.error(`[Storage API] File not found: ${relativePath}`);
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  try {
    const stats = fs.statSync(filePath);
    const contentType = getContentType(filePath);
    
    // Create a readable stream for the file
    const nodeStream = fs.createReadStream(filePath);
    
    // Convert Node.js ReadStream to Web ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        nodeStream.on('data', (chunk) => controller.enqueue(chunk));
        nodeStream.on('end', () => controller.close());
        nodeStream.on('error', (err) => controller.error(err));
      },
      cancel() {
        nodeStream.destroy();
      }
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': stats.size.toString(),
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error: any) {
    console.error(`[Storage API] Error serving file ${relativePath}:`, error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case '.pdf': return 'application/pdf';
    case '.jpg':
    case '.jpeg': return 'image/jpeg';
    case '.png': return 'image/png';
    case '.txt': return 'text/plain';
    case '.json': return 'application/json';
    default: return 'application/octet-stream';
  }
}
