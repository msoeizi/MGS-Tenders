'use client';

import { useState, useEffect } from 'react';
import { calculateRowMaterialCost, calculateLineTotal } from '@/lib/calculations';

export default function EstimateTab({ estimateRows, finishes, onUpdate }: { 
  estimateRows: any[], 
  finishes: any[],
  onUpdate: (data: any[]) => void 
}) {
  const [rows, setRows] = useState(estimateRows || []);

  const handleChange = (index: number, name: string, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [name]: value };
    setRows(newRows);
  };

  const handleBlur = () => {
    onUpdate(rows);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Internal Estimate</h2>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', background: 'rgba(158, 103, 38, 0.03)', borderBottom: '1px solid var(--surface-border)' }}>
              <th style={{ padding: '0.75rem' }}>Item / Description</th>
              <th style={{ padding: '0.75rem' }}>Qty</th>
              <th style={{ padding: '0.75rem' }}>Material (Sum)</th>
              <th style={{ padding: '0.75rem' }}>Hardware</th>
              <th style={{ padding: '0.75rem' }}>Fab (Man x Hr)</th>
              <th style={{ padding: '0.75rem' }}>Inst (Man x Hr)</th>
              <th style={{ padding: '0.75rem' }}>Misc</th>
              <th style={{ padding: '0.75rem', textAlign: 'right' }}>Line Total</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => {
              const materialCost = calculateRowMaterialCost(row.material_breakdown || [], finishes);
              const total = calculateLineTotal(row, materialCost);

              return (
                <tr key={i} style={{ borderBottom: '1px solid rgba(158, 103, 38, 0.05)' }}>
                  <td style={{ padding: '0.5rem', fontWeight: '600' }}>
                    <input 
                      className="form-input" 
                      value={row.row_label || ''} 
                      onChange={(e) => handleChange(i, 'row_label', e.target.value)} 
                      onBlur={handleBlur} 
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input 
                      type="number"
                      className="form-input" 
                      value={row.quantity || 1} 
                      onChange={(e) => handleChange(i, 'quantity', parseFloat(e.target.value))} 
                      onBlur={handleBlur} 
                      style={{ width: '60px' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ fontSize: '0.625rem', color: 'var(--secondary)' }}>
                      {(row.material_breakdown || []).map((mb: any) => (
                        <div key={mb.finish_code}>{mb.finish_code}: {mb.quantity}</div>
                      ))}
                    </div>
                    <strong style={{ display: 'block', marginTop: '0.25rem' }}>${materialCost.toFixed(2)}</strong>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <input 
                      type="number"
                      className="form-input" 
                      value={row.hardware_cost || 0} 
                      onChange={(e) => handleChange(i, 'hardware_cost', parseFloat(e.target.value))} 
                      onBlur={handleBlur} 
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input 
                        type="number"
                        className="form-input" 
                        value={row.fabrication_headcount || 0} 
                        onChange={(e) => handleChange(i, 'fabrication_headcount', parseFloat(e.target.value))} 
                        onBlur={handleBlur} 
                        placeholder="Men"
                        style={{ width: '50px' }}
                      />
                      <span>x</span>
                      <input 
                        type="number"
                        className="form-input" 
                        value={row.fabrication_hours_each || 0} 
                        onChange={(e) => handleChange(i, 'fabrication_hours_each', parseFloat(e.target.value))} 
                        onBlur={handleBlur} 
                        placeholder="Hrs"
                        style={{ width: '50px' }}
                      />
                    </div>
                  </td>
                  <td style={{ padding: '0.5rem' }}>
                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                      <input 
                        type="number"
                        className="form-input" 
                        value={row.install_headcount || 0} 
                        onChange={(e) => handleChange(i, 'install_headcount', parseFloat(e.target.value))} 
                        onBlur={handleBlur} 
                        placeholder="Men"
                        style={{ width: '50px' }}
                      />
                      <span>x</span>
                      <input 
                        type="number"
                        className="form-input" 
                        value={row.install_hours_each || 0} 
                        onChange={(e) => handleChange(i, 'install_hours_each', parseFloat(e.target.value))} 
                        onBlur={handleBlur} 
                        placeholder="Hrs"
                        style={{ width: '50px' }}
                      />
                    </div>
                  </td>
                   <td style={{ padding: '0.5rem' }}>
                    <input 
                      type="number"
                      className="form-input" 
                      value={row.misc_cost_placeholder || 0} 
                      onChange={(e) => handleChange(i, 'misc_cost_placeholder', parseFloat(e.target.value))} 
                      onBlur={handleBlur} 
                      style={{ width: '80px' }}
                    />
                  </td>
                  <td style={{ padding: '0.5rem', textAlign: 'right', fontWeight: '700', color: 'var(--primary)' }}>
                    ${total.toFixed(2)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
             <tr style={{ background: 'rgba(158, 103, 38, 0.05)', fontWeight: '700' }}>
                <td colSpan={7} style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem' }}>Project Total:</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontSize: '1rem', color: 'var(--primary)' }}>
                  ${rows.reduce((sum, row) => sum + calculateLineTotal(row, calculateRowMaterialCost(row.material_breakdown || [], finishes)), 0).toFixed(2)}
                </td>
              </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
