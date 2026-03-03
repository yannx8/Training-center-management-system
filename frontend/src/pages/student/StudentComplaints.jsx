// FILE: /frontend/src/pages/student/StudentComplaints.jsx
import { useState } from 'react';
import { submitMarkComplaint } from '../../api/studentApi';
import '../../styles/Page.css';

export default function StudentComplaints() {
  const [form, setForm] = useState({ trainerId: '', subject: '', description: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await submitMarkComplaint(form);
      setMessage('Complaint submitted successfully');
      setForm({ trainerId: '', subject: '', description: '' });
      setTimeout(() => setMessage(''), 4000);
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  return (
    <div>
      <h1 className="page-title">Submit Grade Appeal</h1>
      <div className="table-card" style={{ maxWidth: 540 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-field"><label>Trainer ID *</label><input type="number" value={form.trainerId} onChange={e => setForm({...form, trainerId: e.target.value})} placeholder="Enter trainer ID" /></div>
          <div className="form-field"><label>Subject *</label><input value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} placeholder="Brief subject of your appeal" /></div>
          <div className="form-field"><label>Description</label><textarea rows={4} value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Describe your concern..." /></div>
          {message && <div style={{ color: 'green', marginBottom: '0.5rem' }}>{message}</div>}
          {error && <div className="form-error">{error}</div>}
          <button type="submit" className="btn-primary">Submit Appeal</button>
        </form>
      </div>
    </div>
  );
}