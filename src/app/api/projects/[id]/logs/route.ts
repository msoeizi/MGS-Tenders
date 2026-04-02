import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    const logs = await prisma.apiLog.findMany({
      where: { project_id },
      orderBy: { created_at: 'desc' },
      take: 50
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('Fetch Logs Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
