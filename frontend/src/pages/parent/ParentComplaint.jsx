// FILE: /frontend/src/pages/parent/ParentComplaint.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getMyStudents, submitComplaint } from '../../api/parentApi';
import '../../styles/Page.css';

export default function ParentComplaint() {
  const { data: students } = useFetch(getMyStudents);
  const [form, setForm] = useState({ studentId: '', subject: '', description: '', priority: 'medium' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await submitComplaint(form);
      setMessage('Complaint submitted successfully');
      setForm({ studentId: '', subject: '', description: '', priority: 'medium' });
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  return (
    <div>
      <h1 className="page-title">Submit Complaint</h1>
      <div className="table-card" style={{ maxWidth: 540 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-field"><label>Regarding Student *</label>
            <select value={form.studentId} onChange={e => setForm({...form, studentId: e.target.value})}>
              <option value="">Select student</option>
              {(students || []).map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="form-field"><label>Subject *</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Brief subject of complaint" /></div>
          <div className="form-field"><label>Description</label><textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
          <div className="form-field"><label>Priority</label>
            <select value={form.priority} onChange={e => setForm({...form, priority: e.target.value})}>
              <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
            </select>
          </div>
          {message && <div style={{ color: 'green', marginBottom: '0.5rem' }}>{message}</div>}
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary">Submit Complaint</button>
        </form>
      </div>
    </div>
  );
}