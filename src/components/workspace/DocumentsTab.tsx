import { useState, useRef } from 'react';

export default function DocumentsTab({ project, onUpload }: { 
  project: any, 
  onUpload: (newAssets: any[]) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      uploadFiles(files);
    }
  };

  const uploadFiles = async (files: File[]) => {
    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    try {
      const res = await fetch(`/api/projects/${project.id}/documents`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        onUpload(data.assets);
      }
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="glass-panel animate-slide-up">
      <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>Project Documents</h2>
      
      <div 
        className={`dropzone ${isDragging ? 'active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{ marginBottom: '2rem' }}
      >
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          style={{ display: 'none' }} 
          onChange={(e) => e.target.files && uploadFiles(Array.from(e.target.files))}
        />
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{uploading ? '⏳' : '📤'}</div>
        <p className="dropzone-text"><strong>{uploading ? 'Uploading...' : 'Drag and drop'}</strong> or click to add documents</p>
        <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', color: 'var(--secondary)' }}>
          Drawings, Specifications, or Addenda (.pdf, .jpg, .png)
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
        {project.fileAssets?.length > 0 ? (
          project.fileAssets.map((asset: any) => (
            <div key={asset.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ fontSize: '1.5rem' }}>📄</div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ 
                  fontSize: '0.875rem', 
                  fontWeight: '600', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis' 
                }}>
                  {asset.original_filename}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                  {new Date(asset.uploaded_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
