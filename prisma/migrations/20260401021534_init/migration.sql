-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_title" TEXT NOT NULL,
    "estimate_number" TEXT,
    "project_address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "issue_date" DATETIME,
    "due_date" DATETIME,
    "project_type" TEXT,
    "tender_discipline" TEXT,
    "designer_name" TEXT,
    "designer_company" TEXT,
    "designer_contact" TEXT,
    "descriptive_summary" TEXT,
    "driving_distance_km" REAL,
    "driving_time_minutes" INTEGER,
    "scope_classification" TEXT,
    "scope_confidence" REAL,
    "project_status" TEXT NOT NULL DEFAULT 'Draft',
    "active_template_id" TEXT,
    "created_by" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    "locked_for_export" BOOLEAN NOT NULL DEFAULT false,
    "version_number" INTEGER NOT NULL DEFAULT 1
);

-- CreateTable
CREATE TABLE "FileAsset" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "original_filename" TEXT NOT NULL,
    "source_interface" TEXT,
    "upload_batch_id" TEXT,
    "mime_type" TEXT,
    "page_count" INTEGER,
    "file_storage_path" TEXT NOT NULL,
    "extracted_text_path" TEXT,
    "rendered_image_path_prefix" TEXT,
    "checksum" TEXT,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "replaced_by_file_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "FileAsset_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentRegistry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "document_type" TEXT,
    "discipline" TEXT,
    "relevance_to_mgs" TEXT,
    "confidence" REAL,
    "likely_relevant_pages" TEXT,
    "likely_noise_pages" TEXT,
    "notes" TEXT,
    "extracted_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DocumentRegistry_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DocumentRegistry_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "FileAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvidenceRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "source_file_id" TEXT NOT NULL,
    "source_page_number" INTEGER,
    "source_region_coordinates" TEXT,
    "screenshot_path" TEXT,
    "source_text_excerpt" TEXT,
    "interpretation_note" TEXT,
    "evidence_type" TEXT,
    "confidence" REAL,
    "linked_entity_type" TEXT,
    "linked_entity_id" TEXT,
    CONSTRAINT "EvidenceRecord_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EvidenceRecord_source_file_id_fkey" FOREIGN KEY ("source_file_id") REFERENCES "FileAsset" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MillworkItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "parent_item_id" TEXT,
    "item_name" TEXT NOT NULL,
    "display_label" TEXT,
    "room_area" TEXT,
    "floor_level" TEXT,
    "functional_group" TEXT,
    "item_type_tag" TEXT,
    "scope_description" TEXT,
    "scope_status" TEXT,
    "install_supply_type" TEXT,
    "quantity" REAL NOT NULL DEFAULT 1,
    "unit_label" TEXT NOT NULL DEFAULT 'EA',
    "finish_codes" TEXT,
    "evidence_confidence" REAL,
    "review_status" TEXT NOT NULL DEFAULT 'Pending',
    "user_locked" BOOLEAN NOT NULL DEFAULT false,
    "created_by_source" TEXT,
    "visible_in_client_estimate" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "MillworkItem_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinishScheduleItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "finish_code" TEXT NOT NULL,
    "material_category" TEXT,
    "material_name" TEXT,
    "description" TEXT,
    "areas_used" TEXT,
    "unit_type" TEXT,
    "unit_cost" REAL,
    "vendor_placeholder" TEXT,
    "notes" TEXT,
    "confidence" REAL,
    "linked_item_ids" TEXT,
    CONSTRAINT "FinishScheduleItem_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EstimateRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "linked_item_id" TEXT,
    "parent_estimate_row_id" TEXT,
    "row_label" TEXT NOT NULL,
    "sow_text" TEXT,
    "material_cost" REAL NOT NULL DEFAULT 0,
    "hardware_cost" REAL NOT NULL DEFAULT 0,
    "design_hours" REAL NOT NULL DEFAULT 0,
    "fabrication_headcount" REAL,
    "fabrication_hours_each" REAL,
    "install_headcount" REAL,
    "install_hours_each" REAL,
    "fabrication_cost" REAL NOT NULL DEFAULT 0,
    "installation_cost" REAL NOT NULL DEFAULT 0,
    "item_unit_price" REAL NOT NULL DEFAULT 0,
    "quantity" REAL NOT NULL DEFAULT 1,
    "line_total" REAL NOT NULL DEFAULT 0,
    "misc_cost" REAL NOT NULL DEFAULT 0,
    "misc_notes" TEXT,
    "pricing_method" TEXT,
    "overhead_included_flag" BOOLEAN NOT NULL DEFAULT false,
    "tax_applicable_flag" BOOLEAN NOT NULL DEFAULT false,
    "manual_override_flag" BOOLEAN NOT NULL DEFAULT false,
    "lock_calculation_flag" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "EstimateRow_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "EstimateRow_linked_item_id_fkey" FOREIGN KEY ("linked_item_id") REFERENCES "MillworkItem" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SubcontractorBlock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "estimate_row_id" TEXT NOT NULL,
    "subcontract_type" TEXT,
    "material_subcost" REAL NOT NULL DEFAULT 0,
    "fabricate_subcost" REAL NOT NULL DEFAULT 0,
    "install_subcost" REAL NOT NULL DEFAULT 0,
    "supplier_name" TEXT,
    "quote_reference" TEXT,
    "notes" TEXT,
    CONSTRAINT "SubcontractorBlock_estimate_row_id_fkey" FOREIGN KEY ("estimate_row_id") REFERENCES "EstimateRow" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClientPresentationRow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "source_estimate_row_ids" TEXT,
    "display_label" TEXT NOT NULL,
    "display_sow" TEXT,
    "display_price" REAL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "template_visibility_rule" TEXT,
    "group_name" TEXT,
    "render_style" TEXT,
    CONSTRAINT "ClientPresentationRow_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewFlag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "linked_entity_type" TEXT,
    "linked_entity_id" TEXT,
    "severity" TEXT,
    "category" TEXT,
    "description" TEXT,
    "suggest_action" TEXT,
    "resolved_flag" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" DATETIME,
    CONSTRAINT "ReviewFlag_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "linked_entity_type" TEXT,
    "linked_entity_id" TEXT,
    "user_comment" TEXT NOT NULL,
    "request_type" TEXT,
    "status" TEXT,
    "response_summary" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Comment_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VersionSnapshot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "snapshot_type" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT,
    "changed_entities_summary" TEXT,
    "snapshot_payload_reference" TEXT,
    CONSTRAINT "VersionSnapshot_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
