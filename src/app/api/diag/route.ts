import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  const cwd = process.cwd();
  const dirContents = (dir: string) => {
    try {
      if (fs.existsSync(dir)) {
        return fs.readdirSync(dir).slice(0, 10);
      }
      return 'DOES NOT EXIST';
    } catch (e: any) {
      return `ERROR: ${e.message}`;
    }
  };

  return NextResponse.json({
    cwd,
    storageExists: fs.existsSync(path.join(cwd, 'storage')),
    publicStorageExists: fs.existsSync(path.join(cwd, 'public', 'storage')),
    rootContents: dirContents(cwd),
    storageContents: dirContents(path.join(cwd, 'storage')),
    publicStorageContents: dirContents(path.join(cwd, 'public', 'storage')),
    pendingContents: dirContents(path.join(cwd, 'storage', 'pending')),
    publicPendingContents: dirContents(path.join(cwd, 'public', 'storage', 'pending')),
  });
}
