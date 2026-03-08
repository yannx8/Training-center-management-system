// FILE: /frontend/src/pages/student/StudentAnnouncements.jsx
import { useState, useEffect } from 'react';
import { getAnnouncements } from '../../api/studentApi';
import '../../styles/Student.css';

const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function StudentAnnouncements() {
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
            <div className="student-page-head">
                <div>
                    <h1 className="student-title">Announcements</h1>
                    <p className="student-sub">Department announcements from your HOD.</p>
                </div>
            </div>

            {loading ? (
                <div className="student-msg">Loading announcements…</div>
            ) : !announcements.length ? (
                <div className="student-card">
                    <p className="student-msg">No announcements yet. Check back soon.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {announcements.map(a => (
                        <div key={a.id} className="student-card" style={{ borderLeft: '4px solid #0f4c3a' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h3 style={{ fontWeight: 700, color: '#0f4c3a', margin: 0 }}>{a.title}</h3>
                                <span style={{ fontSize: '0.75rem', color: '#888' }}>{fmt(a.created_at)}</span>
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
