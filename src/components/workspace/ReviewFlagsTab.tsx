'use client';

import { useState } from 'react';
import EvidencePopover from './EvidencePopover';

export default function ReviewFlagsTab({ flags, allEvidence, onUpdate, onViewEvidence }: { 
  flags: any[], 
  allEvidence: any[],
  onUpdate: (data: any[]) => void,
  onViewEvidence: (evidence_id: string) => void
}) {
  const [localFlags, setLocalFlags] = useState(flags || []);

  const handleChange = (index: number, name: string, value: any) => {
    const newFlags = [...localFlags];
    newFlags[index] = { ...newFlags[index], [name]: value };
    setLocalFlags(newFlags);
  };

  const handleBlur = () => {
    onUpdate(localFlags);
  };

  return (
    <div className="glass-panel animate-slide-up" style={{ borderLeft: '4px solid var(--danger)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Review Flags</h2>
        <button className="btn btn-ghost" onClick={() => setLocalFlags([...localFlags, { message: 'New flag', severity: 'medium' }])}>+ Add Flag</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {localFlags.map((flag, i) => (
          <div 
            key={i} 
            style={{ 
              padding: '1.25rem', 
              background: flag.severity === 'high' ? 'rgba(211, 47, 47, 0.03)' : 'rgba(158, 103, 38, 0.03)', 
              borderRadius: 'var(--radius-sm)', 
              border: `1px solid ${flag.severity === 'high' ? 'rgba(211, 47, 47, 0.1)' : 'rgba(158, 103, 38, 0.1)'}`,
              display: 'grid',
              gridTemplateColumns: 'auto 1fr auto',
              gap: '1rem',
              alignItems: 'start'
            }}
          >
            <div style={{ fontSize: '1.5rem' }}>{flag.severity === 'high' ? '🚩' : '⚠️'}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               <input 
                 className="form-input" 
                 value={flag.message || ''} 
                 onChange={(e) => handleChange(i, 'message', e.target.value)} 
                 onBlur={handleBlur} 
                 style={{ fontWeight: '600', width: '100%' }}
               />
               <textarea 
                 className="form-input" 
                 value={flag.suggested_action || ''} 
                 onChange={(e) => handleChange(i, 'suggested_action', e.target.value)} 
                 onBlur={handleBlur} 
                 placeholder="Suggested Action"
                 style={{ minHeight: '40px', fontSize: '0.8125rem' }}
               />
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.25rem' }}>
                 {(flag.evidence_refs || '').split(',').filter(Boolean).map((ref: string) => (
                   <EvidencePopover 
                      key={ref.trim()} 
                      evidenceId={ref.trim()} 
                      allEvidence={allEvidence} 
                    />
                 ))}
               </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
               <select 
                 className="form-input" 
                 value={flag.severity || 'medium'} 
                 onChange={(e) => handleChange(i, 'severity', e.target.value)} 
                 onBlur={handleBlur}
                 style={{ width: '100px', fontSize: '0.75rem' }}
               >
                 <option value="low">Low</option>
                 <option value="medium">Medium</option>
                 <option value="high">High</option>
               </select>
               <button className="file-remove-btn" onClick={() => setLocalFlags(localFlags.filter((_, idx) => idx !== i))}>×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
