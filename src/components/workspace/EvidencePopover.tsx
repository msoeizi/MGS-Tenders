'use client';

import { useState, useRef, useEffect } from 'react';

interface EvidenceRecord {
  id: string;
  evidence_id: string | null;
  document_id: string;
  page_number: number | null;
  evidence_type: string | null;
  excerpt_text: string | null;
  explanation: string | null;
  confidence: number | null;
  sheet_reference: string | null;
  image_url: string | null;
}

export default function EvidencePopover({ 
  evidenceId, 
  allEvidence 
}: { 
  evidenceId: string; 
  allEvidence: EvidenceRecord[] 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const evidence = allEvidence.find(e => e.evidence_id === evidenceId);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  if (!evidence) return <span className="badge badge-error">Missing: {evidenceId}</span>;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        type="button"
        onMouseEnter={() => setIsOpen(true)}
        className="badge badge-info" 
        style={{ cursor: 'pointer', border: 'none', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
      >
        📁 {evidenceId}
      </button>

      {isOpen && (
        <div 
          ref={popoverRef}
          onMouseLeave={() => setIsOpen(false)}
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%) translateY(-10px)',
            width: '320px',
            backgroundColor: 'white',
            boxShadow: 'var(--shadow-lg)',
            borderRadius: '12px',
            padding: '1rem',
            zIndex: 100,
            border: '1px solid var(--surface-border)',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontWeight: '700', color: 'var(--primary)', fontSize: '0.875rem' }}>{evidence.evidence_id}</span>
            <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{evidence.evidence_type}</span>
          </div>

          {evidence.sheet_reference && (
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--secondary)', marginBottom: '0.5rem' }}>
              Sheet: {evidence.sheet_reference} {evidence.page_number ? `(Page ${evidence.page_number})` : ''}
            </div>
          )}

          {evidence.image_url && (
            <div style={{ 
              width: '100%', 
              height: '140px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '6px', 
              overflow: 'hidden', 
              marginBottom: '0.75rem',
              border: '1px solid var(--surface-border)'
            }}>
              <img 
                src={evidence.image_url} 
                alt="Source Evidence" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                   (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>
          )}

          <div style={{ fontSize: '0.8125rem', color: 'var(--text)', marginBottom: '0.5rem', fontStyle: 'italic', borderLeft: '3px solid var(--accent)', paddingLeft: '0.5rem' }}>
            "{evidence.excerpt_text?.substring(0, 150)}{evidence.excerpt_text && evidence.excerpt_text.length > 150 ? '...' : ''}"
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
            <strong>Reasoning:</strong> {evidence.explanation}
          </div>

          <div 
            style={{ 
              position: 'absolute', 
              top: '100%', 
              left: '50%', 
              transform: 'translateX(-50%)',
              width: '0', 
              height: '0', 
              borderLeft: '10px solid transparent', 
              borderRight: '10px solid transparent', 
              borderTop: '10px solid white' 
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateX(-50%) translateY(0); }
          to { opacity: 1; transform: translateX(-50%) translateY(-10px); }
        }
      `}</style>
    </div>
  );
}
