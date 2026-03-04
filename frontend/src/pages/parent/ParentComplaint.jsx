// FILE: /frontend/src/pages/parent/ParentComplaint.jsx
import { useState, useEffect } from 'react';
import { getMyStudents, submitComplaint } from '../../api/parentApi';

const cardStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '1.5rem', maxWidth: 560 };
const fieldStyle = { display: 'flex', flexDirection: 'column', marginBottom: '1rem' };
const labelStyle = { fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' };
const inputStyle = { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.875rem', background: '#fff' };
const btnStyle = { padding: '0.55rem 1.25rem', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 4, fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' };

export default function ParentComplaint() {
    const [students, setStudents] = useState([]);
    const [form, setForm] = useState({ studentId: '', subject: '', description: '', priority: 'medium' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getMyStudents().then(res => setStudents(res.data.data || [])).catch(() => {});
    }, []);

    async function handleSubmit() {
        if (!form.studentId || !form.subject.trim()) {
            setError('Please select a student and enter a subject.');
            return;
        }
        setSubmitting(true);
        setError('');
        try {
            await submitComplaint({ ...form, studentId: parseInt(form.studentId) });
            setMessage('Complaint submitted successfully!');
            setForm({ studentId: '', subject: '', description: '', priority: 'medium' });
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <div style={{ marginBottom: '1.25rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed', margin: '0 0 0.2rem' }}>Submit Complaint</h1>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>Submit a complaint regarding your child to the administration</p>
            </div>

            <div style={cardStyle}>
                {message && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '0.75rem 1rem', borderRadius: 4, fontSize: '0.875rem', marginBottom: '1rem' }}>
                        {message}
                    </div>
                )}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem 1rem', borderRadius: 4, fontSize: '0.875rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}

                <div style={fieldStyle}>
                    <label style={labelStyle}>Regarding Child *</label>
                    <select
                        style={inputStyle}
                        value={form.studentId}
                        onChange={e => setForm({ ...form, studentId: e.target.value })}
                    >
                        <option value="">— Select a child —</option>
                        {students.map(s => (
                            <option key={s.id} value={s.id}>{s.full_name} ({s.matricule})</option>
                        ))}
                    </select>
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Subject *</label>
                    <input
                        style={inputStyle}
                        value={form.subject}
                        onChange={e => setForm({ ...form, subject: e.target.value })}
                        placeholder="Brief subject of your complaint"
                    />
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Description</label>
                    <textarea
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit' }}
                        rows={4}
                        value={form.description}
                        onChange={e => setForm({ ...form, description: e.target.value })}
                        placeholder="Describe your complaint in detail…"
                    />
                </div>

                <div style={fieldStyle}>
                    <label style={labelStyle}>Priority</label>
                    <select style={inputStyle} value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                    </select>
                </div>

                <button
                    style={{ ...btnStyle, opacity: submitting ? 0.6 : 1 }}
                    onClick={handleSubmit}
                    disabled={submitting}
                >
                    {submitting ? 'Submitting…' : 'Submit Complaint'}
                </button>
            </div>
        </div>
    );
}