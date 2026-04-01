'use client';

import { useState } from 'react';

export default function MillworkTab({ items, onUpdate, onViewEvidence }: { 
  items: any[], 
  onUpdate: (data: any[]) => void,
  onViewEvidence: (evidence_id: string) => void
}) {
  const [localItems, setLocalItems] = useState(items || []);

  const handleChange = (index: number, name: string, value: any) => {
    const newItems = [...localItems];
    newItems[index] = { ...newItems[index], [name]: value };
    setLocalItems(newItems);
  };

  const handleBlur = () => {
    onUpdate(localItems);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Millwork Schedule</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-ghost" onClick={() => setLocalItems([...localItems, { item_name: 'New Item' }])}>+ Add Item</button>
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--secondary)' }}>
              <th style={{ padding: '0.75rem' }}>Item Name</th>
              <th style={{ padding: '0.75rem' }}>Area/Room</th>
              <th style={{ padding: '0.75rem' }}>Finishes</th>
              <th style={{ padding: '0.75rem' }}>Confidence</th>
              <th style={{ padding: '0.75rem' }}>Evidence</th>
              <th style={{ padding: '0.75rem' }}>Description</th>
            </tr>
          </thead>
          <tbody>
            {localItems.map((item, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(158, 103, 38, 0.05)' }}>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    value={item.item_name || ''} 
                    onChange={(e) => handleChange(i, 'item_name', e.target.value)} 
                    onBlur={handleBlur} 
                    style={{ fontWeight: '600' }}
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <input 
                    className="form-input" 
                    value={item.room_area || ''} 
                    onChange={(e) => handleChange(i, 'room_area', e.target.value)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <input 
                    className="form-input" 
                    value={item.finish_codes || ''} 
                    onChange={(e) => handleChange(i, 'finish_codes', e.target.value)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={`badge ${item.confidence > 0.8 ? 'badge-success' : 'badge-info'}`}>
                      {Math.round((item.confidence || 0) * 100)}%
                    </span>
                  </div>
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                     {(item.evidence_refs || '').split(',').filter(Boolean).map((ref: string) => (
                       <button 
                         key={ref} 
                         className="badge badge-info" 
                         style={{ cursor: 'pointer', border: 'none' }}
                         onClick={() => onViewEvidence(ref.trim())}
                        >
                         📁 {ref.trim()}
                       </button>
                     ))}
                   </div>
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <textarea 
                    className="form-input" 
                    value={item.scope_description || ''} 
                    onChange={(e) => handleChange(i, 'scope_description', e.target.value)} 
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
