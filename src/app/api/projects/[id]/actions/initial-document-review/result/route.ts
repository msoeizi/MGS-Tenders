import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const project_id = params.id;
  
  try {
    const payload = await req.json();
    const mode = payload.mode || 'replace'; // Default behavior
    
    // Extract registry-aligned sections
    const {
      project_info,
      project_contacts,
      millwork_schedule,
      finish_schedule,
      estimate_prefill,
      review_flags,
      evidence_index
    } = payload;

    // Perform transaction to ensure data integrity
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update Project basic info
      if (project_info) {
        await tx.project.update({
          where: { id: project_id },
          data: {
            project_title: project_info.project_title,
            project_address: project_info.project_address,
            project_description: project_info.project_description,
            project_type: project_info.project_type,
            scope_classification: project_info.scope_classification,
            distance_from_47_geraldton: project_info.distance_from_47_geraldton,
          }
        });
      }

      // 2. Sync Contacts
      if (project_contacts) {
        if (mode === 'replace') {
          await tx.contact.deleteMany({ where: { project_id } });
        }
        await tx.contact.createMany({
          data: project_contacts.map((c: any) => ({
            ...c,
            project_id
          }))
        });
      }

      // 3. Sync Evidence Index (Always Upsert by evidence_id)
      if (evidence_index) {
        for (const ev of evidence_index) {
          await tx.evidenceRecord.upsert({
            where: { evidence_id: ev.evidence_id || '' },
            update: { ...ev, project_id },
            create: { ...ev, project_id }
          });
        }
      }

      // 4. Sync Finish Schedule
      if (finish_schedule) {
        if (mode === 'replace') {
          await tx.finishScheduleItem.deleteMany({ where: { project_id } });
        }
        for (const f of finish_schedule) {
          // For merge mode, we'd need a unique constraint on (project_id, finish_code)
          // Since it's a baseline action, we'll recreate or clear-and-add for now
          await tx.finishScheduleItem.create({
            data: { ...f, project_id }
          });
        }
      }

      // 5. Sync Millwork Schedule
      if (millwork_schedule) {
        if (mode === 'replace') {
          await tx.millworkItem.deleteMany({ where: { project_id } });
        }
        for (const item of millwork_schedule) {
          await tx.millworkItem.create({
            data: { ...item, project_id }
          });
        }
      }

      // 6. Sync Estimate Prefill & Material Breakdown
      if (estimate_prefill) {
        if (mode === 'replace') {
          await tx.estimateRow.deleteMany({ where: { project_id } });
        }
        for (const row of estimate_prefill) {
          const { material_breakdown, ...rowData } = row;
          
          const createdRow = await tx.estimateRow.create({
            data: { ...rowData, project_id }
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

      // 7. Sync Review Flags (Always Upsert by flag_id)
      if (review_flags) {
        for (const flag of review_flags) {
          await tx.reviewFlag.upsert({
            where: { flag_id: flag.flag_id || '' },
            update: { ...flag, project_id },
            create: { ...flag, project_id }
          });
        }
      }

      return { success: true, mode_applied: mode };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Action Ingestion Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
