'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NewProjectModal({ isOpen, onClose }: NewProjectModalProps) {
  const [step, setStep] = useState<'form' | 'analyzing'>('form');
  const [formData, setFormData] = useState({ title: '', address: '' });
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const router = useRouter();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    if (step === 'analyzing') {
      const timer = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            // Simulate completion and redirect
            setTimeout(() => {
              router.push('/projects/1'); // Redirect to a mock project
              onClose();
            }, 500);
            return 100;
          }
          return prev + 2;
        });
      }, 100);
      return () => clearInterval(timer);
    }
  }, [step, router, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container glass-panel" onClick={(e) => e.stopPropagation()}>
        {step === 'form' ? (
          <>
            <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Start New Tender Analysis</h2>
            
            <div className="form-group">
              <label className="form-label">Project Title</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="e.g. Skyline Apartments Phase 2"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Location / Address</label>
              <input 
                type="text" 
                className="form-input" 
                placeholder="City, Province"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tender Documents</label>
              <div 
                className={`dropzone ${isDragging ? 'active' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                <input 
                  id="file-upload" 
                  type="file" 
                  multiple 
                  style={{ display: 'none' }} 
                  onChange={handleFileSelect}
                />
                <span className="dropzone-icon" style={{ fontSize: '2.5rem', marginBottom: '1rem', display: 'block' }}>📄</span>
                <p className="dropzone-text"><strong>Drag and drop</strong> or click to upload</p>
                <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--secondary)' }}>
                  PDF drawings, specifications, OR Addenda
                </p>
              </div>

              {selectedFiles.length > 0 && (
                <div className="file-preview-list">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="file-preview-item">
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                        📄 {file.name}
                      </span>
                      <button className="file-remove-btn" onClick={() => removeFile(idx)}>×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
              <button 
                className="btn btn-primary" 
                disabled={!formData.title || selectedFiles.length === 0}
                onClick={() => setStep('analyzing')}
              >
                Start AI Analysis
              </button>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1.5rem' }}>🤖</div>
            <h2 style={{ marginBottom: '0.5rem' }}>AI is Analyzing...</h2>
            <div style={{ fontSize: '0.8125rem', color: 'var(--secondary)', marginBottom: '1rem' }}>
              {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} detected.
            </div>
            <p style={{ color: 'var(--secondary)', fontSize: '0.875rem' }}>
              Extracting millwork items, finish schedules, and scope evidence from your documents.
            </p>
            
            <div className="analysis-progress">
              <div 
                className={`analysis-bar ${step === 'analyzing' ? 'active' : ''}`} 
                style={{ width: `${progress}%`, transition: 'none' }} 
              />
            </div>
            
            <p style={{ marginTop: '1rem', fontWeight: '600', color: 'var(--primary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
              {progress < 30 ? 'Reading Drawings...' : progress < 60 ? 'Extracting Schedules...' : progress < 90 ? 'Comparing Addenda...' : 'Finalizing Workspace...'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
