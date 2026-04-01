export interface FinishItem {
  finish_code: string;
  unit_cost: number;
}

export interface MaterialBreakdownItem {
  finish_code: string;
  quantity: number;
}

export interface EstimateRowData {
  quantity: number;
  hardware_cost: number;
  design_hours: number;
  fabrication_headcount: number;
  fabrication_hours_each: number;
  install_headcount: number;
  install_hours_each: number;
  misc_cost_placeholder: number;
  material_breakdown: MaterialBreakdownItem[];
}

export const FABRICATION_RATE = 45; // Placeholder rate
export const INSTALLATION_RATE = 55; // Placeholder rate

export function calculateRowMaterialCost(breakdown: MaterialBreakdownItem[], finishes: FinishItem[]) {
  return breakdown.reduce((total, mb) => {
    const finish = finishes.find(f => f.finish_code === mb.finish_code);
    return total + (mb.quantity * (finish?.unit_cost || 0));
  }, 0);
}

export function calculateRowFabricationCost(row: EstimateRowData) {
  return (row.fabrication_headcount || 0) * (row.fabrication_hours_each || 0) * FABRICATION_RATE;
}

export function calculateRowInstallationCost(row: EstimateRowData) {
  return (row.install_headcount || 0) * (row.install_hours_each || 0) * INSTALLATION_RATE;
}

export function calculateLineTotal(row: EstimateRowData, materialCost: number) {
  const fab = calculateRowFabricationCost(row);
  const inst = calculateRowInstallationCost(row);
  const unitPrice = materialCost + (row.hardware_cost || 0) + fab + inst + (row.misc_cost_placeholder || 0);
  return unitPrice * (row.quantity || 1);
}
