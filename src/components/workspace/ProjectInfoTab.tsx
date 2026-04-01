'use client';

import { useState } from 'react';

export default function ProjectInfoTab({ project, onUpdate }: { project: any, onUpdate: (data: any) => void }) {
  const [formData, setFormData] = useState({
    project_title: project?.project_title || '',
    project_address: project?.project_address || '',
    project_description: project?.project_description || '',
    project_type: project?.project_type || '',
    scope_classification: project?.scope_classification || '',
    distance_from_47_geraldton: project?.distance_from_47_geraldton || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBlur = () => {
    onUpdate(formData);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <h2 style={{ marginBottom: '1.5rem', color: 'var(--primary)' }}>Project Information</h2>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
        <div className="form-group">
          <label className="form-label">Project Title</label>
          <input 
            className="form-input" 
            name="project_title" 
            value={formData.project_title} 
            onChange={handleChange} 
            onBlur={handleBlur}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Project Address</label>
          <input 
            className="form-input" 
            name="project_address" 
            value={formData.project_address} 
            onChange={handleChange} 
            onBlur={handleBlur}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Classification</label>
          <select 
            className="form-input" 
            name="scope_classification" 
            value={formData.scope_classification} 
            onChange={handleChange} 
            onBlur={handleBlur}
          >
            <option value="">Select Classification</option>
            <option value="supply_and_install">Supply and Install</option>
            <option value="install_only">Install Only</option>
            <option value="supply_only">Supply Only</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Project Type</label>
          <input 
            className="form-input" 
            name="project_type" 
            value={formData.project_type} 
            onChange={handleChange} 
            onBlur={handleBlur}
          />
        </div>
        <div className="form-group">
          <label className="form-label">Distance from 47 Geraldton</label>
          <input 
            className="form-input" 
            name="distance_from_47_geraldton" 
            value={formData.distance_from_47_geraldton} 
            onChange={handleChange} 
            onBlur={handleBlur}
          />
        </div>
        <div className="form-group" style={{ gridColumn: 'span 2' }}>
          <label className="form-label">Project Description</label>
          <textarea 
            className="form-input" 
            name="project_description" 
            value={formData.project_description} 
            onChange={handleChange} 
            onBlur={handleBlur}
            style={{ minHeight: '120px' }}
          />
        </div>
      </div>
    </div>
  );
}
