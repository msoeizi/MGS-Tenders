import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { logApiCommunication } from '@/lib/api-logger';

export const dynamic = 'force-dynamic';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: project_id } = await params;
  let payload: any;
  
  try {
    const payload = await req.json();
    console.log(`[Action Result] Incoming payload keys:`, Object.keys(payload));
    
    // 1. Normalize the data from various possible GPT formats
    // GPT-4o sometimes sends the entire JSON as a string inside a 'result' key, 
    // or nests it inside 'result' as an object, or sends it flat.
    function normalizeData(p: any) {
      // If it's a string, try parsing it
      if (typeof p === 'string') {
        try { return JSON.parse(p); } catch { return p; }
      }
      
      // If result exists and is a string, parse it
      if (p.result && typeof p.result === 'string') {
        try { return JSON.parse(p.result); } catch { /* fall through */ }
      }

      // If result exists and is an object, use it
      if (p.result && typeof p.result === 'object' && p.result !== null) {
        // Deeply check if there's ANOTHER 'result' key (sometimes doubles up)
        if (p.result.result) return normalizeData(p.result.result);
        return p.result;
      }

      return p;
    }

    const data = normalizeData(payload);
    const mode = data.mode || 'replace';
    
    const {
      project_info,
      project_contacts,
      millwork_schedule,
      finish_schedule,
      estimate_prefill,
      review_flags,
      evidence_index
    } = data;

    // VALIDATION: Reject empty/meaningless submissions
    const hasMillwork = Array.isArray(millwork_schedule) && millwork_schedule.length > 0;
    const hasFinish = Array.isArray(finish_schedule) && finish_schedule.length > 0;
    const hasEvidence = Array.isArray(evidence_index) && evidence_index.length > 0;
    const hasFlags = Array.isArray(review_flags) && review_flags.length > 0;
    const hasBasicInfo = project_info && project_info.project_title && project_info.project_title.length > 3;

    if (!hasMillwork && !hasFinish && !hasEvidence && !hasFlags && !hasBasicInfo) {
      const errorMsg = `Empty result rejected. Detected: millwork=${hasMillwork}, finish=${hasFinish}, evidence=${hasEvidence}, flags=${hasFlags}, info=${hasBasicInfo}`;
      console.warn(`[Action Result] ${errorMsg}`, { keys: Object.keys(data) });
      
      await logApiCommunication(
        project_id,
        '/actions/initial-document-review/result',
        'POST',
        payload,
        { error: errorMsg },
        400
      );

      return NextResponse.json({ error: errorMsg }, { status: 400 });
    }

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
          // Normalize unit_cost to number or null
          let unitCost = null;
          if (f.unit_cost !== undefined && f.unit_cost !== null && f.unit_cost !== '') {
            unitCost = typeof f.unit_cost === 'number' ? f.unit_cost : parseFloat(f.unit_cost);
            if (isNaN(unitCost)) unitCost = null;
          }

          await tx.finishScheduleItem.create({
            data: {
              finish_code: f.finish_code,
              material_category: f.material_category,
              material_name: f.material_name,
              description: f.description,
              areas_used: Array.isArray(f.areas_used) ? f.areas_used.join(', ') : f.areas_used,
              unit_type: f.unit_type,
              unit_cost: unitCost,
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
          // Normalize tags to string
          let tagsStr = '';
          if (Array.isArray(item.tags)) {
            tagsStr = item.tags.join(', ');
          } else if (typeof item.tags === 'string') {
            tagsStr = item.tags;
          }

          const created = await tx.millworkItem.create({
            data: {
              item_name: item.item_name,
              room_area: item.room_area,
              tags: tagsStr,
              scope_description: item.scope_description,
              finish_codes: Array.isArray(item.finish_codes) ? item.finish_codes.join(', ') : item.finish_codes,
              confidence: item.confidence,
              evidence_refs: Array.isArray(item.evidence_refs) ? item.evidence_refs.join(', ') : item.evidence_refs,
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
          await tx.evidenceRecord.upsert({
            where: { evidence_id: evidence_id || '' },
            update: { 
              ...evData, 
              document_id: document_id,
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
          const prisma_related_id = related_item_id ? millwork_id_map[related_item_id] : related_item_id;

          await tx.reviewFlag.upsert({
            where: { flag_id: flag_id || '' },
            update: { 
              ...flagData, 
              related_item_id: prisma_related_id,
              evidence_refs: Array.isArray(flag.evidence_refs) ? flag.evidence_refs.join(', ') : flag.evidence_refs,
              project_id 
            },
            create: { 
              ...flagData, 
              flag_id: flag_id || '',
              related_item_id: prisma_related_id,
              evidence_refs: Array.isArray(flag.evidence_refs) ? flag.evidence_refs.join(', ') : flag.evidence_refs,
              project_id 
            }
          });
        }
      }

      return { success: true, mode_applied: mode, millwork_count: millwork_schedule?.length || 0 };
    });

    // LOG SUCCESSFUL COMMUNICATION
    await logApiCommunication(
      project_id,
      '/actions/initial-document-review/result',
      'POST',
      payload,
      result,
      200
    );

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Action Ingestion Error:', error);
    
    // Log failure
    await logApiCommunication(
      project_id,
      '/actions/initial-document-review/result',
      'POST',
      payload || {},
      { error: error.message },
      500
    );

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
