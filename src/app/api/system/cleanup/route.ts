import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Find projects not accessed in 30 days
    const staleProjects = await prisma.project.findMany({
      where: {
        last_accessed_at: {
          lt: thirtyDaysAgo
        },
        fileAssets: {
          some: {
            is_deleted_from_disk: false
          }
        }
      },
      include: {
        fileAssets: true
      }
    });

    let deletedCount = 0;
    let reclaimedBytes = 0;

    for (const project of staleProjects) {
      const projectDir = path.join(process.cwd(), 'storage', `project_${project.id}`);
      
      try {
        // Delete the physical directory
        await fs.rm(projectDir, { recursive: true, force: true });
        
        // Update database records
        for (const asset of project.fileAssets) {
          if (!asset.is_deleted_from_disk) {
            await prisma.fileAsset.update({
              where: { id: asset.id },
              data: { is_deleted_from_disk: true }
            });
            deletedCount++;
            reclaimedBytes += asset.file_size_bytes ? Number(asset.file_size_bytes) : 0;
          }
        }
      } catch (err) {
        console.error(`[Cleanup API] Error deleting directory for project ${project.id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      projects_cleaned: staleProjects.length,
      files_deleted: deletedCount,
      bytes_reclaimed: reclaimedBytes
    });
  } catch (error: any) {
    console.error('[Cleanup API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
