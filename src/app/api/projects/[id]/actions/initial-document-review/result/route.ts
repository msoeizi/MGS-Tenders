import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  
  try {
    const payload = await req.json();
    const mode = payload.mode || 'replace';
    
    const {
      project_info,
      project_contacts,
      millwork_schedule,
      finish_schedule,
      estimate_prefill,
      review_flags,
      evidence_index
    } = payload;

    const result = await prisma.$transaction(async (tx: any) => {
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
            distance_from_47_geraldton: project_info.distance_from_47_geraldton?.toString(),
          }
        });
      }

      // 2. Sync Contacts (Replace)
      if (project_contacts) {
        if (mode === 'replace') {
          await tx.contact.deleteMany({ where: { project_id } });
        }
        await tx.contact.createMany({
          data: project_contacts.map((c: any) => ({
            company: c.company,
            contact_name: c.contact_name,
            email: c.email,
            phone_number: c.phone_number,
            category: c.category,
            project_id
          }))
        });
      }

      // 3. Sync Finish Schedule (Replace)
      if (finish_schedule) {
        if (mode === 'replace') {
          await tx.finishScheduleItem.deleteMany({ where: { project_id } });
        }
        for (const f of finish_schedule) {
          await tx.finishScheduleItem.create({
            data: {
              finish_code: f.finish_code,
              material_category: f.material_category,
              material_name: f.material_name,
              description: f.description,
              areas_used: f.areas_used,
              unit_type: f.unit_type,
              unit_cost: f.unit_cost,
              vendor_placeholder: f.vendor_placeholder,
              notes: f.notes,
              confidence: f.confidence,
              project_id
            }
          });
        }
      }

      // 4. Sync Millwork Schedule (Replace)
      const millwork_id_map: Record<string, string> = {};
      if (millwork_schedule) {
        if (mode === 'replace') {
          await tx.millworkItem.deleteMany({ where: { project_id } });
        }
        for (const item of millwork_schedule) {
          const created = await tx.millworkItem.create({
            data: {
              item_name: item.item_name,
              room_area: item.room_area,
              tags: item.tags,
              scope_description: item.scope_description,
              finish_codes: item.finish_codes,
              confidence: item.confidence,
              evidence_refs: item.evidence_refs,
              project_id
            }
          });
          if (item.item_id) {
            millwork_id_map[item.item_id] = created.id;
          }
        }
      }

      // 5. Sync Estimate Prefill (Replace)
      if (estimate_prefill) {
        if (mode === 'replace') {
          await tx.estimateRow.deleteMany({ where: { project_id } });
        }
        for (const row of estimate_prefill) {
          const { material_breakdown, item_id, ...rowData } = row;
          
          // Link to millwork item if item_id was provided and mapped
          const linked_item_id = item_id ? millwork_id_map[item_id] : null;

          const createdRow = await tx.estimateRow.create({
            data: {
              ...rowData,
              linked_item_id,
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

      // 6. Sync Evidence Index (Upsert by evidence_id)
      if (evidence_index) {
        for (const ev of evidence_index) {
          const { evidence_id, document_id, ...evData } = ev;
          // Note: document_id in payload refers to FileAsset.id
          await tx.evidenceRecord.upsert({
            where: { evidence_id: evidence_id || '' },
            update: { 
              ...evData, 
              document_id: document_id, // Map payload document_id to schema document_id (FileAsset)
              project_id 
            },
            create: { 
              ...evData, 
              evidence_id: evidence_id || '',
              document_id: document_id,
              project_id 
            }
          });
        }
      }

      // 7. Sync Review Flags (Upsert by flag_id)
      if (review_flags) {
        for (const flag of review_flags) {
          const { flag_id, related_item_id, ...flagData } = flag;
          
          // Map related_item_id to Prisma ID if it exists in our map
          const prisma_related_id = related_item_id ? millwork_id_map[related_item_id] : related_item_id;

          await tx.reviewFlag.upsert({
            where: { flag_id: flag_id || '' },
            update: { 
              ...flagData, 
              related_item_id: prisma_related_id,
              project_id 
            },
            create: { 
              ...flagData, 
              flag_id: flag_id || '',
              related_item_id: prisma_related_id,
              project_id 
            }
          });
        }
      }

      return { success: true, mode_applied: mode, millwork_count: millwork_schedule?.length || 0 };
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Action Ingestion Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
