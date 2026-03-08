// FILE: /frontend/src/pages/parent/ParentAnnouncements.jsx
import { useState, useEffect } from 'react';
import { getAnnouncements } from '../../api/parentApi';

const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function ParentAnnouncements() {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getAnnouncements()
            .then(res => setAnnouncements(res.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.25rem' }}>Announcements</h1>
            <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                Announcements from the departments your child(ren) are enrolled in.
            </p>

            {loading ? (
                <div>Loading announcements…</div>
            ) : !announcements.length ? (
                <div style={{ padding: '2rem', textAlign: 'center', color: '#888', background: '#fff', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                    No announcements yet. Check back soon.
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {announcements.map(a => (
                        <div key={a.id} style={{
                            background: '#fff', borderRadius: 10, padding: '1.25rem',
                            border: '1px solid #e5e7eb', borderLeft: '4px solid #2563eb',
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h3 style={{ fontWeight: 700, color: '#1e3a5f', margin: 0 }}>{a.title}</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {a.department_name && (
                                        <span style={{ fontSize: '0.72rem', background: '#dbeafe', color: '#1e40af', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
                                            {a.department_name}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '0.75rem', color: '#888' }}>{fmt(a.created_at)}</span>
                                </div>
                            </div>
                            <p style={{ color: '#444', fontSize: '0.875rem', marginTop: '0.5rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{a.body}</p>
                            {a.author_name && (
                                <p style={{ fontSize: '0.75rem', color: '#888', marginTop: '0.5rem' }}>— {a.author_name}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
