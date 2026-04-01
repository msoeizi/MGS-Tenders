'use client';

import { useState } from 'react';

export default function FinishesTab({ finishes, onUpdate }: { 
  finishes: any[], 
  onUpdate: (data: any[]) => void 
}) {
  const [localFinishes, setLocalFinishes] = useState(finishes || []);

  const handleChange = (index: number, name: string, value: any) => {
    const newFinishes = [...localFinishes];
    newFinishes[index] = { ...newFinishes[index], [name]: value };
    setLocalFinishes(newFinishes);
  };

  const handleBlur = () => {
    onUpdate(localFinishes);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Finish Schedule</h2>
        <button className="btn btn-ghost" onClick={() => setLocalFinishes([...localFinishes, { finish_code: 'NEW' }])}>+ Add Finish</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--secondary)' }}>
              <th style={{ padding: '0.75rem' }}>Code</th>
              <th style={{ padding: '0.75rem' }}>Category</th>
              <th style={{ padding: '0.75rem' }}>Material Name</th>
              <th style={{ padding: '0.75rem' }}>Unit Type</th>
              <th style={{ padding: '0.75rem' }}>Unit Cost</th>
              <th style={{ padding: '0.75rem' }}>Notes</th>
            </tr>
          </thead>
          <tbody>
            {localFinishes.map((finish, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(158, 103, 38, 0.05)' }}>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    value={finish.finish_code || ''} 
                    onChange={(e) => handleChange(i, 'finish_code', e.target.value)} 
                    onBlur={handleBlur} 
                    style={{ fontWeight: '700', width: '80px', color: 'var(--primary)' }}
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <input 
                    className="form-input" 
                    value={finish.material_category || ''} 
                    onChange={(e) => handleChange(i, 'material_category', e.target.value)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <input 
                    className="form-input" 
                    value={finish.material_name || ''} 
                    onChange={(e) => handleChange(i, 'material_name', e.target.value)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <input 
                    className="form-input" 
                    value={finish.unit_type || 'sqft'} 
                    onChange={(e) => handleChange(i, 'unit_type', e.target.value)} 
                    onBlur={handleBlur} 
                    style={{ width: '80px' }}
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <input 
                    type="number"
                    className="form-input" 
                    value={finish.unit_cost || 0} 
                    onChange={(e) => handleChange(i, 'unit_cost', parseFloat(e.target.value))} 
                    onBlur={handleBlur} 
                    style={{ width: '100px' }}
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <textarea 
                    className="form-input" 
                    value={finish.notes || ''} 
                    onChange={(e) => handleChange(i, 'notes', e.target.value)} 
                    onBlur={handleBlur} 
                    style={{ minHeight: '40px', fontSize: '0.75rem' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
