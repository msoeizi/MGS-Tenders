import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // 1. Get total storage used from FileAsset (BigInt summation)
    const assets = await prisma.fileAsset.findMany({
      where: { is_deleted_from_disk: false },
      select: { file_size_bytes: true }
    });

    const totalUsageBytes = assets.reduce((acc, curr) => {
      return acc + (curr.file_size_bytes ? Number(curr.file_size_bytes) : 0);
    }, 0);

    // 2. Get project breakdown (top 10 projects by size)
    const projects = await prisma.project.findMany({
      include: {
        fileAssets: {
          where: { is_deleted_from_disk: false },
          select: { file_size_bytes: true }
        }
      }
    });

    const projectBreakdown = projects.map(p => {
      const size = p.fileAssets.reduce((acc, curr) => {
        return acc + (curr.file_size_bytes ? Number(curr.file_size_bytes) : 0);
      }, 0);
      return {
        id: p.id,
        title: p.project_title,
        size_bytes: size,
        last_accessed: p.last_accessed_at
      };
    }).sort((a, b) => b.size_bytes - a.size_bytes).slice(0, 10);

    return NextResponse.json({
      success: true,
      total_usage_bytes: totalUsageBytes,
      server_limit_bytes: 20 * 1024 * 1024 * 1024, // 20GB Assumption for DigitalOcean
      project_breakdown: projectBreakdown
    });
  } catch (error: any) {
    console.error('[Storage Usage API] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
