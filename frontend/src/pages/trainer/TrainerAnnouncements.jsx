// FILE: /frontend/src/pages/trainer/TrainerAnnouncements.jsx
import { useState, useEffect } from 'react';
import { getAnnouncements } from '../../api/trainerApi';
import '../../styles/Trainer.css';

const fmt = (d) => d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

export default function TrainerAnnouncements() {
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
            <div className="trainer-page-head">
                <div>
                    <h1 className="trainer-title">Announcements</h1>
                    <p className="trainer-sub">Department announcements from HODs of programs you teach.</p>
                </div>
            </div>

            {loading ? (
                <div className="trainer-msg">Loading announcements…</div>
            ) : !announcements.length ? (
                <div className="trainer-card">
                    <p className="trainer-msg">No announcements yet. Check back soon.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {announcements.map(a => (
                        <div key={a.id} className="trainer-card" style={{ borderLeft: '4px solid #3b5be8' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                                <h3 style={{ fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{a.title}</h3>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                    {a.department_name && (
                                        <span style={{ fontSize: '0.72rem', background: '#e0e7ff', color: '#3730a3', borderRadius: 12, padding: '2px 10px', fontWeight: 600 }}>
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
