import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getMarkComplaints, reviewMarkComplaint } from '../../api/trainerApi';
import Badge from '../../components/Badge';
import Modal from '../../components/Modal';
import '../../styles/Trainer.css';

export default function TrainerComplaints() {
    const { data, loading, refetch } = useFetch(getMarkComplaints);
    const [selectedCourse, setSelectedCourse] = useState(null); // { id, name } | null
    const [editItem, setEditItem] = useState(null);
    const [response, setResponse] = useState('');
    const [submitting, setSubmitting] = useState(false);

    async function handleReview() {
        if (!response.trim()) return;
        setSubmitting(true);
        try {
            await reviewMarkComplaint(editItem.id, { response });
            setEditItem(null);
            setResponse('');
            refetch();
        } catch {
            // keep modal open on error
        } finally {
            setSubmitting(false);
        }
    }

    // ── Build course groups from flat complaint list ───────────────────────
    const courseGroups = (() => {
        if (!data?.length) return [];
        const map = {};
        data.forEach(c => {
            const key = c.course_id || `cert-${c.certification_id}`;
            const label = c.course_name || c.certification_name || 'Unknown';
            if (!map[key]) map[key] = { key, label, isCert: !c.course_id, complaints: [] };
            map[key].complaints.push(c);
        });
        return Object.values(map).sort((a, b) => b.complaints.length - a.complaints.length);
    })();

    const visibleComplaints = selectedCourse
        ? (data || []).filter(c => {
              const key = c.course_id || `cert-${c.certification_id}`;
              return key === selectedCourse.key;
          })
        : [];

    const pendingTotal = (data || []).filter(c => c.status === 'pending').length;

    // ── Course list view ──────────────────────────────────────────────────
    if (!selectedCourse) {
        return (
            <div>
                <div className="trainer-page-head">
                    <div>
                        <h1 className="trainer-title">Mark Complaints</h1>
                        <p className="trainer-sub">
                            {loading ? 'Loading…' : `${courseGroups.length} course(s) with complaints · ${pendingTotal} pending`}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="trainer-msg">Loading…</div>
                ) : !courseGroups.length ? (
                    <div className="trainer-card">
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>💬</div>
                            <div style={{ fontWeight: 600 }}>No complaints received yet</div>
                            <div style={{ fontSize: '0.85rem', marginTop: 6 }}>When students raise mark complaints on your courses, they will appear here.</div>
                        </div>
                    </div>
                ) : (
                    <div className="trainer-card">
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {courseGroups.map(group => {
                                const pending = group.complaints.filter(c => c.status === 'pending').length;
                                const reviewed = group.complaints.length - pending;
                                return (
                                    <div
                                        key={group.key}
                                        onClick={() => setSelectedCourse(group)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                            padding: '1rem 1.25rem',
                                            borderRadius: 8,
                                            border: `1.5px solid ${pending > 0 ? '#fca5a5' : '#e5e7eb'}`,
                                            cursor: 'pointer',
                                            background: pending > 0 ? '#fff7f7' : '#fff',
                                            transition: 'all 0.15s',
                                        }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                                        onMouseLeave={e => e.currentTarget.style.background = pending > 0 ? '#fff7f7' : '#fff'}
                                    >
                                        <div>
                                            <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                {group.isCert ? '🏆' : '📚'} {group.label}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                                                {group.complaints.length} complaint{group.complaints.length !== 1 ? 's' : ''} total
                                                {reviewed > 0 && ` · ${reviewed} reviewed`}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            {pending > 0 && (
                                                <span style={{
                                                    background: '#fee2e2', color: '#dc2626',
                                                    padding: '3px 10px', borderRadius: 999,
                                                    fontSize: '0.78rem', fontWeight: 700,
                                                }}>
                                                    {pending} pending
                                                </span>
                                            )}
                                            {pending === 0 && (
                                                <span style={{
                                                    background: '#dcfce7', color: '#16a34a',
                                                    padding: '3px 10px', borderRadius: 999,
                                                    fontSize: '0.78rem', fontWeight: 700,
                                                }}>
                                                    All reviewed
                                                </span>
                                            )}
                                            <span style={{ color: '#3b5be8', fontSize: '1.1rem' }}>›</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Complaints for selected course ────────────────────────────────────
    const coursePending = visibleComplaints.filter(c => c.status === 'pending').length;
    return (
        <div>
            <div className="trainer-page-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setSelectedCourse(null)}
                        style={{
                            background: 'none', border: '1.5px solid #cbd5e1', borderRadius: 6,
                            padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: '#475569',
                        }}
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="trainer-title">{selectedCourse.label}</h1>
                        <p className="trainer-sub">
                            {visibleComplaints.length} complaint{visibleComplaints.length !== 1 ? 's' : ''}
                            {coursePending > 0 && ` · ${coursePending} pending`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="trainer-card">
                <div className="hod-table-wrap">
                    <table className="hod-table" style={{ width: '100%' }}>
                        <thead>
                            <tr>
                                <th style={{ textAlign: 'left' }}>Student</th>
                                <th style={{ textAlign: 'left' }}>Subject</th>
                                <th style={{ textAlign: 'left' }}>Description</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {visibleComplaints.map(c => (
                                <tr key={c.id}>
                                    <td>
                                        <div style={{ fontWeight: 600 }}>{c.student_name}</div>
                                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{c.matricule}</div>
                                    </td>
                                    <td style={{ maxWidth: 200 }}>{c.subject}</td>
                                    <td style={{ maxWidth: 280, fontSize: '0.85rem', color: '#475569' }}>
                                        {c.description?.length > 80 ? c.description.slice(0, 80) + '…' : c.description}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        <Badge label={c.status} />
                                    </td>
                                    <td style={{ textAlign: 'center', fontSize: '0.8rem', color: '#64748b', whiteSpace: 'nowrap' }}>
                                        {new Date(c.created_at).toLocaleDateString('en-GB')}
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                        {c.status === 'pending' ? (
                                            <button
                                                className="trainer-btn"
                                                style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                                                onClick={() => { setEditItem(c); setResponse(''); }}
                                            >
                                                Review
                                            </button>
                                        ) : (
                                            <button
                                                style={{
                                                    background: 'none', border: '1px solid #cbd5e1',
                                                    borderRadius: 5, padding: '4px 10px',
                                                    fontSize: '0.78rem', cursor: 'pointer', color: '#64748b',
                                                }}
                                                onClick={() => { setEditItem(c); setResponse(c.trainer_response || ''); }}
                                            >
                                                View
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {editItem && (
                <Modal title={editItem.status === 'pending' ? 'Review Complaint' : 'Complaint Details'} onClose={() => setEditItem(null)}>
                    <div style={{ display: 'grid', gap: '0.5rem', marginBottom: '1rem' }}>
                        <p><strong>Student:</strong> {editItem.student_name} ({editItem.matricule})</p>
                        <p><strong>Subject:</strong> {editItem.subject}</p>
                        <p><strong>Description:</strong> {editItem.description}</p>
                        {editItem.trainer_response && (
                            <p style={{ background: '#f0fdf4', padding: '0.5rem 0.75rem', borderRadius: 6, color: '#166534' }}>
                                <strong>Previous response:</strong> {editItem.trainer_response}
                            </p>
                        )}
                    </div>
                    {editItem.status === 'pending' && (
                        <>
                            <div className="form-field">
                                <label>Your Response *</label>
                                <textarea
                                    rows={4}
                                    value={response}
                                    onChange={e => setResponse(e.target.value)}
                                    placeholder="Write your response to the student's complaint…"
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="btn-cancel" onClick={() => setEditItem(null)}>Cancel</button>
                                <button className="btn-confirm" onClick={handleReview} disabled={!response.trim() || submitting}>
                                    {submitting ? 'Submitting…' : 'Submit Review'}
                                </button>
                            </div>
                        </>
                    )}
                    {editItem.status !== 'pending' && (
                        <div className="modal-actions">
                            <button className="btn-cancel" onClick={() => setEditItem(null)}>Close</button>
                        </div>
                    )}
                </Modal>
            )}
        </div>
    );
}