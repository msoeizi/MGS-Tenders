import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    const project = await prisma.project.findUnique({
      where: { id: project_id },
      include: {
        contacts: true,
        millworkItems: true,
        finishScheduleItems: true,
        estimateRows: {
          include: {
            material_breakdown: true,
          }
        },
        reviewFlags: true,
        evidenceRecords: true,
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json(project);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    const body = await req.json();
    
    // Simplistic update for now (allow partial updates to Project model)
    const updated = await prisma.project.update({
      where: { id: project_id },
      data: body,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
