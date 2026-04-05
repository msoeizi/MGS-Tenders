import { useState, useRef } from 'react';

export default function DocumentsTab({ project, onUpload }: { 
  project: any, 
  onUpload: (newAssets: any[]) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const copyUrl = (asset: any) => {
    if (asset.is_deleted_from_disk) return;
    const baseUrl = window.location.origin;
    const fullUrl = `${baseUrl}/api/storage/${asset.file_storage_path}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(asset.id);
    setTimeout(() => setCopiedId(null), 2000);
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {project.fileAssets?.length > 0 ? (
          project.fileAssets.map((asset: any) => (
            <div key={asset.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ fontSize: '1.75rem' }}>📄</div>
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <div style={{ 
                    fontSize: '0.925rem', 
                    fontWeight: '600', 
                    whiteSpace: 'nowrap', 
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis',
                    color: 'var(--text-primary)'
                  }}>
                    {asset.original_filename}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--secondary)' }}>
                    Uploaded {new Date(asset.uploaded_at).toLocaleDateString()}
                    {asset.file_size_bytes && ` • ${formatFileSize(Number(asset.file_size_bytes))}`}
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                gap: '0.5rem', 
                paddingTop: '0.5rem', 
                borderTop: '1px solid var(--surface-border)' 
              }}>
                <button 
                  onClick={() => !asset.is_deleted_from_disk && window.open(`/api/storage/${asset.file_storage_path}`, '_blank')}
                  disabled={asset.is_deleted_from_disk}
                  className={`btn ${asset.is_deleted_from_disk ? 'btn-disabled' : 'btn-ghost'}`}
                  style={{ 
                    flex: 1, 
                    fontSize: '0.75rem', 
                    padding: '0.5rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.4rem',
                    textDecoration: 'none',
                    color: asset.is_deleted_from_disk ? 'var(--text-muted)' : '#64748b'
                  }}
                >
                  👁️ View
                </button>
                <button 
                  onClick={() => copyUrl(asset)}
                  disabled={asset.is_deleted_from_disk}
                  className={`btn ${copiedId === asset.id ? 'btn-success' : 'btn-ghost'}`}
                  style={{ 
                    flex: 1.5, 
                    fontSize: '0.75rem', 
                    padding: '0.5rem',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    gap: '0.4rem',
                    background: copiedId === asset.id ? '#dcfce7' : 'transparent',
                    color: copiedId === asset.id ? '#166534' : '#64748b'
                  }}
                >
                  {copiedId === asset.id ? '✅ Copied' : '🔗 Copy Dev URL'}
                </button>
              </div>

              <div style={{ 
                fontSize: '0.65rem', 
                color: 'var(--text-muted)', 
                background: 'rgba(0,0,0,0.03)', 
                padding: '0.4rem 0.6rem', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={asset.file_storage_path}>
                Path: {asset.file_storage_path}
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
