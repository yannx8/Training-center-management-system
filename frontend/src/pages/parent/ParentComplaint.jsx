// FILE: /frontend/src/pages/parent/ParentComplaint.jsx
import { useState, useEffect } from 'react';
import { getMyStudents, submitComplaint } from '../../api/parentApi';

const C = '#7c3aed';

export default function ParentComplaint() {
    const [students, setStudents] = useState([]);
    const [studLoading, setStudLoading] = useState(true);
    const [form, setForm] = useState({ studentId: '', subject: '', description: '', priority: 'medium' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        getMyStudents()
            .then(res => {
                const list = res.data.data || [];
                setStudents(list);
                // Auto-select if only one child
                if (list.length === 1) setForm(f => ({ ...f, studentId: String(list[0].id) }));
            })
            .catch(() => {})
            .finally(() => setStudLoading(false));
    }, []);

    async function handleSubmit() {
        setError(''); setMessage('');
        if (!form.studentId) { setError('Please select a child.'); return; }
        if (!form.subject.trim()) { setError('Please enter a subject.'); return; }

        setSubmitting(true);
        try {
            await submitComplaint({ ...form, studentId: parseInt(form.studentId) });
            setMessage('✅ Complaint submitted successfully! The administration will review it shortly.');
            setForm(f => ({ ...f, subject: '', description: '', priority: 'medium' }));
            setTimeout(() => setMessage(''), 8000);
        } catch (err) {
            setError(err.response?.data?.message || 'Submission failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    const inputStyle = { padding: '0.5rem 0.75rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.875rem', background: '#fff', width: '100%', boxSizing: 'border-box' };

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.5rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: C, margin: '0 0 0.25rem' }}>Submit Complaint</h1>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>Submit a complaint or concern regarding your child to the administration</p>
            </div>

            <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '1.75rem', maxWidth: 580 }}>

                {message && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '0.85rem 1rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 600 }}>
                        {message}
                    </div>
                )}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.85rem 1rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.875rem' }}>
                        {error}
                    </div>
                )}

                {/* Regarding Child */}
                <div style={{ marginBottom: '1.1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                        Regarding Child *
                    </label>
                    {studLoading ? (
                        <p style={{ color: '#888', fontSize: '0.82rem' }}>Loading children…</p>
                    ) : students.length === 0 ? (
                        <p style={{ color: '#888', fontSize: '0.82rem' }}>No children linked to your account.</p>
                    ) : students.length === 1 ? (
                        <div style={{ ...inputStyle, background: '#f9fafb', color: '#555', cursor: 'default', display: 'flex', alignItems: 'center' }}>
                            <strong>{students[0].full_name}</strong>&nbsp;({students[0].matricule})
                        </div>
                    ) : (
                        <select style={inputStyle} value={form.studentId} onChange={e => setForm(f => ({ ...f, studentId: e.target.value }))}>
                            <option value="">— Select a child —</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>{s.full_name} ({s.matricule})</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '1.1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                        Subject *
                    </label>
                    <input
                        style={inputStyle}
                        value={form.subject}
                        onChange={e => setForm(f => ({ ...f, subject: e.target.value }))}
                        placeholder="Brief subject of your complaint"
                        maxLength={200}
                    />
                </div>

                {/* Description */}
                <div style={{ marginBottom: '1.1rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                        Description
                    </label>
                    <textarea
                        style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', minHeight: 100 }}
                        rows={4}
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        placeholder="Describe your concern in detail…"
                    />
                </div>

                {/* Priority */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#444', marginBottom: '0.35rem' }}>
                        Priority
                    </label>
                    <select style={inputStyle} value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                        <option value="low">🟢 Low — general feedback</option>
                        <option value="medium">🟡 Medium — needs attention</option>
                        <option value="high">🔴 High — urgent issue</option>
                    </select>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={submitting || studLoading || !students.length}
                    style={{
                        width: '100%', padding: '0.65rem 1.25rem', background: C, color: '#fff',
                        border: 'none', borderRadius: 6, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer',
                        opacity: (submitting || studLoading || !students.length) ? 0.55 : 1,
                        transition: 'opacity 0.15s',
                    }}
                >
                    {submitting ? 'Submitting…' : 'Submit Complaint'}
                </button>
            </div>
        </div>
    );
}