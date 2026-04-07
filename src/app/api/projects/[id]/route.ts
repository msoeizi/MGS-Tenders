import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    let whereClause: any = { id: project_id };
    
    // Support alias '1' for testing latest project
    if (project_id === '1') {
      const latest = await prisma.project.findFirst({
        orderBy: { created_at: 'desc' }
      });
      if (latest) whereClause = { id: latest.id };
    }

    const project = await prisma.project.findUnique({
      where: whereClause,
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
        fileAssets: true, // Explicitly include fileAssets
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Refresh last_accessed_at to prevent 30-day cleanup
    await prisma.project.update({
      where: { id: project.id },
      data: { last_accessed_at: new Date() }
    });

    const serializedProject = {
      ...project,
      fileAssets: project.fileAssets.map((asset: any) => ({
        ...asset,
        file_size_bytes: asset.file_size_bytes != null ? asset.file_size_bytes.toString() : null
      }))
    };

    return NextResponse.json(serializedProject);
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
    
    // We expect the body to contain specific sections to update, OR general project fields
    const { 
      contacts, 
      millworkItems, 
      finishScheduleItems, 
      estimateRows, 
      reviewFlags, 
      evidenceRecords,
      fileAssets,
      ...projectFields 
    } = body;

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Update general Project fields
      if (Object.keys(projectFields).length > 0) {
        await tx.project.update({
          where: { id: project_id },
          data: projectFields
        });
      }

      // 2. Sync Contacts (Replace strategy)
      if (contacts) {
        await tx.contact.deleteMany({ where: { project_id } });
        await tx.contact.createMany({
          data: contacts.map((c: any) => ({
            company: c.company,
            contact_name: c.contact_name,
            email: c.email,
            phone_number: c.phone_number,
            category: c.category,
            project_id
          }))
        });
      }

      // 3. Sync Finish Schedule Items
      if (finishScheduleItems) {
        await tx.finishScheduleItem.deleteMany({ where: { project_id } });
        await tx.finishScheduleItem.createMany({
          data: finishScheduleItems.map((f: any) => ({
            finish_code: f.finish_code,
            material_category: f.material_category,
            material_name: f.material_name,
            description: f.description,
            areas_used: f.areas_used,
            unit_type: f.unit_type,
            unit_cost: f.unit_cost,
            notes: f.notes,
            confidence: f.confidence,
            project_id
          }))
        });
      }

      // 4. Sync Millwork Items
      if (millworkItems) {
        await tx.millworkItem.deleteMany({ where: { project_id } });
        for (const item of millworkItems) {
          await tx.millworkItem.create({
            data: {
              item_name: item.item_name,
              room_area: item.room_area,
              tags: item.tags,
              scope_description: item.scope_description,
              finish_codes: item.finish_codes,
              confidence: item.confidence,
              evidence_refs: item.evidence_refs,
              review_status: item.review_status,
              user_locked: item.user_locked,
              project_id
            }
          });
        }
      }

      // 5. Sync Estimate Rows (and Material Breakdowns)
      if (estimateRows) {
        await tx.estimateRow.deleteMany({ where: { project_id } });
        for (const row of estimateRows) {
          const { material_breakdown, ...rowData } = row;
          const createdRow = await tx.estimateRow.create({
            data: {
              ...rowData,
              project_id
            }
          });
          if (material_breakdown) {
            await tx.materialBreakdown.createMany({
              data: material_breakdown.map((mb: any) => ({
                ...mb,
                estimate_row_id: createdRow.id
              }))
            });
          }
        }
      }

      // 6. Sync Flags & Evidence
      if (reviewFlags) {
        await tx.reviewFlag.deleteMany({ where: { project_id } });
        await tx.reviewFlag.createMany({
          data: reviewFlags.map((rf: any) => ({
            ...rf,
            project_id
          }))
        });
      }

      if (evidenceRecords) {
        await tx.evidenceRecord.deleteMany({ where: { project_id } });
        await tx.evidenceRecord.createMany({
          data: evidenceRecords.map((er: any) => ({
            ...er,
            project_id
          }))
        });
      }

      return { success: true };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Auto-save Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
