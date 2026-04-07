'use client';
import { useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

export default function DocumentsTab({ project, onUpload }: { 
  project: any, 
  onUpload: (newAssets: any[]) => void 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [rehydratingId, setRehydratingId] = useState<string | null>(null);
  const [rehydrationResults, setRehydrationResults] = useState<Record<string, any>>({});
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

  const handleRehydrate = async (asset: any) => {
    setRehydratingId(asset.id);
    try {
      const res = await fetch(`/api/projects/${project.id}/documents/${asset.id}/rehydrate`, {
        method: 'POST'
      });
      const data = await res.json();
      setRehydrationResults(prev => ({ ...prev, [asset.id]: data }));
    } catch (err) {
      console.error('Rehydration error:', err);
      setRehydrationResults(prev => ({ ...prev, [asset.id]: { error: 'Failed to reprocess' } }));
    } finally {
      setRehydratingId(null);
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

  const getHydrationStatus = (asset: any) => {
    const result = rehydrationResults[asset.id];
    if (result) {
      if (result.error) return { label: 'Error', color: '#ef4444', icon: '❌' };
      if (result.has_text && result.has_images) return { label: 'Ready', color: '#22c55e', icon: '✅' };
      if (result.has_text) return { label: 'Text Only', color: '#f59e0b', icon: '📝' };
      if (result.has_images) return { label: 'Images Only', color: '#3b82f6', icon: '🖼️' };
    }
    // Infer from DB fields
    if (asset.extracted_text_path && asset.rendered_image_path_prefix) return { label: 'Ready', color: '#22c55e', icon: '✅' };
    if (asset.extracted_text_path) return { label: 'Text Only', color: '#f59e0b', icon: '📝' };
    if (asset.rendered_image_path_prefix) return { label: 'Images Only', color: '#3b82f6', icon: '🖼️' };
    return { label: 'Not Processed', color: '#94a3b8', icon: '⏳' };
  };

  const isPdf = (asset: any) =>
    asset.mime_type === 'application/pdf' || asset.original_filename?.toLowerCase().endsWith('.pdf');

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
        {uploading && (
          <p style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.5rem' }}>
            ⚙️ Uploading and queuing text extraction...
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1rem' }}>
        {project.fileAssets?.length > 0 ? (
          project.fileAssets.map((asset: any) => {
            const status = getHydrationStatus(asset);
            const isProcessing = rehydratingId === asset.id;
            const rehydrateResult = rehydrationResults[asset.id];

            return (
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
                      {asset.page_count && ` • ${asset.page_count} pages`}
                    </div>
                  </div>
                  {/* Hydration Status Badge */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.65rem',
                    fontWeight: '600',
                    color: status.color,
                    background: `${status.color}18`,
                    padding: '0.2rem 0.4rem',
                    borderRadius: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    {status.icon} {status.label}
                  </div>
                </div>

                {/* Rehydration Result */}
                {rehydrateResult && !rehydrateResult.error && (
                  <div style={{ 
                    fontSize: '0.7rem', 
                    color: '#166534', 
                    background: '#dcfce7', 
                    padding: '0.4rem 0.6rem', 
                    borderRadius: '4px'
                  }}>
                    ✅ Processed: {rehydrateResult.page_count || '?'} pages • 
                    {rehydrateResult.has_text ? ' Text ✓' : ' No text'} •
                    {rehydrateResult.has_images ? ' Images ✓' : ' No images'}
                    . Reload the page to see updated status.
                  </div>
                )}

                <div style={{ 
                  display: 'flex', 
                  gap: '0.5rem', 
                  paddingTop: '0.5rem', 
                  borderTop: '1px solid var(--surface-border)',
                  flexWrap: 'wrap'
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
                    {copiedId === asset.id ? '✅ Copied' : '🔗 Copy URL'}
                  </button>
                  {isPdf(asset) && (
                    <button
                      onClick={() => handleRehydrate(asset)}
                      disabled={isProcessing}
                      className="btn btn-ghost"
                      title="Re-extract text and re-render pages"
                      style={{
                        flex: '0 0 auto',
                        fontSize: '0.75rem',
                        padding: '0.5rem 0.75rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        color: '#6366f1'
                      }}
                    >
                      <RefreshCw size={12} className={isProcessing ? 'animate-spin' : ''} />
                      {isProcessing ? 'Processing...' : 'Reprocess'}
                    </button>
                  )}
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
            );
          })
        ) : (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: 'var(--secondary)' }}>
            No documents uploaded yet.
          </div>
        )}
      </div>
    </div>
  );
}
