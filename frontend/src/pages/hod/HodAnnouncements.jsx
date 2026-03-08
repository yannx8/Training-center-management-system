// FILE: /frontend/src/pages/hod/HodAnnouncements.jsx
import { useState, useEffect } from 'react';
import { createAnnouncement, getAnnouncements } from '../../api/hodApi';
import '../../styles/Hod.css';

const TARGET_OPTIONS = [
    { value: 'trainer,student,parent', label: '👥 Everyone (Trainers + Students + Parents)' },
    { value: 'trainer', label: '🎓 Trainers only' },
    { value: 'student', label: '📚 Students only' },
    { value: 'parent', label: '👨‍👩‍👧 Parents only' },
    { value: 'trainer,student', label: '🎓📚 Trainers & Students' },
    { value: 'student,parent', label: '📚👨‍👩‍👧 Students & Parents' },
];

const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function HodAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ title: '', body: '', targetRole: 'trainer,student,parent' });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const loadAnnouncements = () => {
        setLoading(true);
        getAnnouncements()
            .then(res => setAnnouncements(res.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { loadAnnouncements(); }, []);

    async function handleCreate() {
        if (!form.title.trim() || !form.body.trim()) {
            setError('Title and body are required.');
            return;
        }
        setSaving(true); setError(''); setSuccess('');
        try {
            await createAnnouncement(form);
            setSuccess('✓ Announcement published.');
            setForm({ title: '', body: '', targetRole: 'trainer,student,parent' });
            setShowForm(false);
            loadAnnouncements();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to publish announcement.');
        } finally {
            setSaving(false);
        }
    }

    const targetLabel = (role) => TARGET_OPTIONS.find(o => o.value === role)?.label || role || 'Everyone';

    return (
        <div>
            <div className="hod-page-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#0f4c3a', margin: 0 }}>Announcements</h1>
                    <p style={{ color: '#666', fontSize: '0.875rem', marginTop: 4 }}>Publish announcements to trainers, students, and/or parents in your department.</p>
                </div>
                <button
                    className="hod-btn-primary"
                    onClick={() => { setShowForm(!showForm); setError(''); setSuccess(''); }}
                >
                    {showForm ? '✕ Cancel' : '+ New Announcement'}
                </button>
            </div>

            {success && <div className="hod-success" style={{ marginBottom: '1rem' }}>{success}</div>}

            {/* Create form */}
            {showForm && (
                <div className="hod-card" style={{ marginBottom: '1.5rem', border: '2px solid #0f4c3a' }}>
                    <h3 style={{ fontWeight: 700, color: '#0f4c3a', marginBottom: '1rem' }}>New Announcement</h3>
                    <div className="hod-field">
                        <label>Title *</label>
                        <input
                            className="hod-input"
                            placeholder="e.g. Exam Schedule Update"
                            value={form.title}
                            onChange={e => setForm({ ...form, title: e.target.value })}
                        />
                    </div>
                    <div className="hod-field">
                        <label>Message *</label>
                        <textarea
                            className="hod-input"
                            rows={4}
                            placeholder="Write your announcement here…"
                            value={form.body}
                            onChange={e => setForm({ ...form, body: e.target.value })}
                            style={{ resize: 'vertical' }}
                        />
                    </div>
                    <div className="hod-field">
                        <label>Target Audience</label>
                        <select
                            className="hod-input"
                            value={form.targetRole}
                            onChange={e => setForm({ ...form, targetRole: e.target.value })}
                        >
                            {TARGET_OPTIONS.map(o => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                        </select>
                    </div>
                    {error && <div className="hod-error">{error}</div>}
                    <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                        <button className="hod-btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button className="hod-btn-primary" onClick={handleCreate} disabled={saving}>
                            {saving ? 'Publishing…' : '📢 Publish'}
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="hod-msg">Loading announcements…</div>
            ) : !announcements.length ? (
                <div className="hod-card">
                    <p className="hod-msg">No announcements yet. Click "New Announcement" to create one.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {announcements.map(a => (
                        <div key={a.id} className="hod-card" style={{ borderLeft: '4px solid #0f4c3a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h3 style={{ fontWeight: 700, color: '#0f4c3a', margin: 0, fontSize: '1rem' }}>{a.title}</h3>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.72rem', background: '#e8f5e9', color: '#2e7d32', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                                        {targetLabel(a.target_role)}
                                    </span>
                                    <span style={{ fontSize: '0.72rem', color: '#999' }}>{fmt(a.created_at)}</span>
                                </div>
                            </div>
                            <p style={{ color: '#444', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.body}</p>
                            {a.author_name && <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>— {a.author_name}</p>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
