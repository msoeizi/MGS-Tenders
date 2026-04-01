'use client';

import { useState } from 'react';

export default function EvidenceTab({ evidence, onUpdate }: { 
  evidence: any[], 
  onUpdate: (data: any[]) => void 
}) {
  const [localEvidence, setLocalEvidence] = useState(evidence || []);

  const handleChange = (index: number, name: string, value: any) => {
    const newEvidence = [...localEvidence];
    newEvidence[index] = { ...newEvidence[index], [name]: value };
    setLocalEvidence(newEvidence);
  };

  const handleBlur = () => {
    onUpdate(localEvidence);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Evidence Index</h2>
        <button className="btn btn-ghost" onClick={() => setLocalEvidence([...localEvidence, { evidence_id: 'EV-NEW', excerpt_text: 'New piece of evidence' }])}>+ Add Evidence</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
        {localEvidence.map((ev, i) => (
          <div 
            key={i} 
            className="glass-card" 
            style={{ 
              background: 'white', 
              display: 'flex', 
              flexDirection: 'column', 
              gap: '0.75rem',
              padding: '1.25rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <input 
                className="form-input" 
                value={ev.evidence_id || ''} 
                onChange={(e) => handleChange(i, 'evidence_id', e.target.value)} 
                onBlur={handleBlur} 
                style={{ fontWeight: '700', width: '100px', color: 'var(--primary)', background: 'transparent', border: 'none', padding: 0 }}
              />
              <span className="badge badge-info">{ev.evidence_type || 'Unknown'}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
              Doc ID: {ev.document_id} | Page: {ev.page_number}
            </div>
            <textarea 
              className="form-input" 
              value={ev.excerpt_text || ''} 
              onChange={(e) => handleChange(i, 'excerpt_text', e.target.value)} 
              onBlur={handleBlur} 
              placeholder="Excerpt text from document..."
              style={{ minHeight: '80px', fontSize: '0.8125rem', background: 'rgba(0,0,0,0.02)' }}
            />
            <textarea 
              className="form-input" 
              value={ev.explanation || ''} 
              onChange={(e) => handleChange(i, 'explanation', e.target.value)} 
              onBlur={handleBlur} 
              placeholder="Why this is relevant..."
              style={{ minHeight: '60px', fontSize: '0.8125rem' }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
