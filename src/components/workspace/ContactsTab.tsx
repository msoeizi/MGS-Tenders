'use client';

import { useState } from 'react';

export default function ContactsTab({ contacts, onUpdate }: { contacts: any[], onUpdate: (data: any[]) => void }) {
  const [localContacts, setLocalContacts] = useState(contacts || []);

  const handleChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const newContacts = [...localContacts];
    newContacts[index] = { ...newContacts[index], [name]: value };
    setLocalContacts(newContacts);
  };

  const handleBlur = () => {
    onUpdate(localContacts);
  };

  const addContact = () => {
    setLocalContacts([...localContacts, { company: '', contact_name: '', email: '', phone_number: '', category: '' }]);
  };

  const removeContact = (index: number) => {
    const newContacts = localContacts.filter((_, i) => i !== index);
    setLocalContacts(newContacts);
    onUpdate(newContacts);
  };

  return (
    <div className="glass-panel animate-slide-up">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: 'var(--primary)', margin: 0 }}>Project Contacts</h2>
        <button className="btn btn-ghost" onClick={addContact}>+ Add Contact</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--surface-border)', color: 'var(--secondary)' }}>
              <th style={{ padding: '0.75rem' }}>Company</th>
              <th style={{ padding: '0.75rem' }}>Name</th>
              <th style={{ padding: '0.75rem' }}>Category</th>
              <th style={{ padding: '0.75rem' }}>Email</th>
              <th style={{ padding: '0.75rem' }}>Phone</th>
              <th style={{ padding: '0.75rem' }}></th>
            </tr>
          </thead>
          <tbody>
            {localContacts.map((contact, i) => (
              <tr key={i} style={{ borderBottom: '1px solid rgba(158, 103, 38, 0.05)' }}>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    name="company" 
                    value={contact.company || ''} 
                    onChange={(e) => handleChange(i, e)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    name="contact_name" 
                    value={contact.contact_name || ''} 
                    onChange={(e) => handleChange(i, e)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    name="category" 
                    value={contact.category || ''} 
                    onChange={(e) => handleChange(i, e)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    name="email" 
                    value={contact.email || ''} 
                    onChange={(e) => handleChange(i, e)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                  <input 
                    className="form-input" 
                    name="phone_number" 
                    value={contact.phone_number || ''} 
                    onChange={(e) => handleChange(i, e)} 
                    onBlur={handleBlur} 
                  />
                </td>
                <td style={{ padding: '0.5rem' }}>
                   <button className="file-remove-btn" onClick={() => removeContact(i)}>×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
