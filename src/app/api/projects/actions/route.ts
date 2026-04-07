import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { action, projectIds } = await req.json();

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return NextResponse.json({ error: 'No project IDs provided.' }, { status: 400 });
    }

    // 1. ARCHIVE / UNARCHIVE
    if (action === 'archive') {
      await prisma.project.updateMany({
        where: { id: { in: projectIds } },
        data: { is_archived: true }
      });
      return NextResponse.json({ success: true, action: 'archive', count: projectIds.length });
    }
    
    if (action === 'unarchive') {
      await prisma.project.updateMany({
        where: { id: { in: projectIds } },
        data: { is_archived: false }
      });
      return NextResponse.json({ success: true, action: 'unarchive', count: projectIds.length });
    }

    // 2. HARD DELETE
    if (action === 'hard_delete') {
      await prisma.$transaction(async (tx: any) => {
        // Collect estimate row IDs to cascade manual deletes on relations
        const rows = await tx.estimateRow.findMany({ 
          where: { project_id: { in: projectIds } }, 
          select: { id: true } 
        });
        const rowIds = rows.map((r: any) => r.id);
        
        if (rowIds.length > 0) {
          // Clear sub-tables of estimateRows
          await tx.materialBreakdown.deleteMany({ where: { estimate_row_id: { in: rowIds } } });
          await tx.subcontractorBlock.deleteMany({ where: { estimate_row_id: { in: rowIds } } });
          // Clear self references (parents)
          await tx.estimateRow.updateMany({ 
            where: { id: { in: rowIds } }, 
            data: { parent_estimate_row_id: null } 
          });
        }

        // Delete project relations
        await tx.estimateRow.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.contact.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.finishScheduleItem.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.millworkItem.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.evidenceRecord.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.reviewFlag.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.documentRegistry.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.fileAsset.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.clientPresentationRow.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.comment.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.versionSnapshot.deleteMany({ where: { project_id: { in: projectIds } } });
        await tx.apiLog.deleteMany({ where: { project_id: { in: projectIds } } });
        
        // Delete Projects
        await tx.project.deleteMany({ where: { id: { in: projectIds } } });
      });
      return NextResponse.json({ success: true, action: 'hard_delete', count: projectIds.length });
    }

    // 3. DUPLICATE
    if (action === 'duplicate') {
      if (projectIds.length !== 1) {
        return NextResponse.json({ error: 'Duplicate action only supports 1 project at a time.' }, { status: 400 });
      }
      
      const sourceId = projectIds[0];
      const sourceProject = await prisma.project.findUnique({
        where: { id: sourceId },
        include: {
          contacts: true,
          finishScheduleItems: true,
          millworkItems: true,
          estimateRows: { include: { material_breakdown: true, subcontractorBlocks: true } }
        }
      });
      
      if (!sourceProject) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });
      
      const newProject = await prisma.project.create({
        data: {
          project_title: `${sourceProject.project_title} (Copy)`,
          project_address: sourceProject.project_address,
          estimate_number: sourceProject.estimate_number,
          project_type: sourceProject.project_type,
          project_description: sourceProject.project_description,
          scope_classification: sourceProject.scope_classification,
          project_status: sourceProject.project_status,
          is_archived: sourceProject.is_archived,
          apiLogs: {
            create: { endpoint: 'internal/duplicate', method: 'COPY', request_body: 'Duplicated from ' + sourceId, status_code: 200 }
          }
        }
      });
      
      // Duplicate relationships
      if (sourceProject.contacts.length) {
         await prisma.contact.createMany({
           data: sourceProject.contacts.map((c: any) => ({
             project_id: newProject.id, company: c.company, contact_name: c.contact_name, email: c.email, phone_number: c.phone_number, category: c.category
           }))
         });
      }

      if (sourceProject.finishScheduleItems.length) {
         await prisma.finishScheduleItem.createMany({
           data: sourceProject.finishScheduleItems.map((f: any) => ({
             project_id: newProject.id, finish_code: f.finish_code, material_category: f.material_category, material_name: f.material_name, description: f.description, areas_used: f.areas_used, unit_type: f.unit_type, unit_cost: f.unit_cost, notes: f.notes
           }))
         });
      }
      
      const millworkMap: Record<string, string> = {};
      for (const m of sourceProject.millworkItems) {
        const createM = await prisma.millworkItem.create({
          data: {
             project_id: newProject.id, item_name: m.item_name, room_area: m.room_area, tags: m.tags, scope_description: m.scope_description, finish_codes: m.finish_codes, confidence: m.confidence, review_status: m.review_status, visible_in_client_estimate: m.visible_in_client_estimate, sort_order: m.sort_order
          }
        });
        millworkMap[m.id] = createM.id;
      }
      
      for (const row of sourceProject.estimateRows) {
         const newRow = await prisma.estimateRow.create({
           data: {
             project_id: newProject.id,
             linked_item_id: row.linked_item_id ? millworkMap[row.linked_item_id] : null,
             row_label: row.row_label,
             sow_text: row.sow_text,
             material_cost: row.material_cost,
             hardware_cost: row.hardware_cost,
             design_hours: row.design_hours,
             fabrication_headcount: row.fabrication_headcount,
             fabrication_hours_each: row.fabrication_hours_each,
             install_headcount: row.install_headcount,
             install_hours_each: row.install_hours_each,
             fabrication_cost: row.fabrication_cost,
             installation_cost: row.installation_cost,
             item_unit_price: row.item_unit_price,
             quantity: row.quantity,
             line_total: row.line_total
           }
         });
         
         if (row.material_breakdown.length) {
           await prisma.materialBreakdown.createMany({
             data: row.material_breakdown.map((mb: any) => ({
               estimate_row_id: newRow.id, finish_code: mb.finish_code, quantity: mb.quantity, basis_note: mb.basis_note
             }))
           });
         }
      }
      
      return NextResponse.json({ success: true, action: 'duplicate', new_project_id: newProject.id });
    }

    return NextResponse.json({ error: 'Invalid action provided.' }, { status: 400 });

  } catch (error: any) {
    console.error('Projects Action Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
