// FILE: /frontend/src/pages/student/StudentComplaints.jsx
import { useState, useEffect } from 'react';
import { submitMarkComplaint, getAppealCourses, getCourseDetails, getMarkComplaintsHistory } from '../../api/studentApi';
import Badge from '../../components/Badge';
import '../../styles/Student.css';

export default function StudentComplaints() {
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [courseDetails, setCourseDetails] = useState(null);
    const [form, setForm] = useState({ subject: '', description: '' });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    useEffect(() => {
        getAppealCourses()
            .then(res => { setCourses(res.data.data || []); setCoursesLoading(false); })
            .catch(() => setCoursesLoading(false));

        getMarkComplaintsHistory()
            .then(res => { setHistory(res.data.data || []); setHistoryLoading(false); })
            .catch(() => setHistoryLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedCourse) { setCourseDetails(null); return; }
        getCourseDetails(selectedCourse)
            .then(res => setCourseDetails(res.data.data))
            .catch(() => setCourseDetails(null));
    }, [selectedCourse]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError(''); setMessage('');
        if (!selectedCourse || !form.subject) {
            setError('Please select a course and enter a subject');
            return;
        }
        setSubmitting(true);
        try {
            await submitMarkComplaint({ courseId: selectedCourse, subject: form.subject, description: form.description });
            setMessage('Grade appeal submitted successfully');
            setForm({ subject: '', description: '' });
            setSelectedCourse('');
            setCourseDetails(null);
            // Refresh history
            const hRes = await getMarkComplaintsHistory();
            setHistory(hRes.data.data || []);
            setTimeout(() => setMessage(''), 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to submit appeal');
        } finally {
            setSubmitting(false);
        }
    }

    const statusColor = (s) => ({
        pending: { bg: '#fef9c3', color: '#92400e' },
        reviewed: { bg: '#dcfce7', color: '#166534' },
    }[s] || { bg: '#f3f4f6', color: '#374151' });

    return (
        <div>
            <div className="student-page-head">
                <h1 className="student-title">Grade Appeals</h1>
            </div>

            {/* My Complaints History — always shown */}
            <div className="student-card" style={{ marginBottom: '1rem' }}>
                <h3 className="student-card-title">My Submitted Appeals</h3>
                {historyLoading ? (
                    <p className="student-msg">Loading…</p>
                ) : !history.length ? (
                    <p style={{ color: '#95a5a6', fontSize: '0.875rem', padding: '0.5rem 0' }}>No appeals submitted yet.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                            <thead>
                                <tr>
                                    {['Course', 'Subject', 'Trainer', 'School Period', 'Status', 'Date'].map(h => (
                                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.75rem', borderBottom: '2px solid #e0e0e0', color: '#7f8c8d', textTransform: 'uppercase', fontSize: '0.72rem', letterSpacing: '0.04em' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(c => {
                                    const sc = statusColor(c.status);
                                    return (
                                        <tr key={c.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '0.55rem 0.75rem', fontWeight: 500 }}>{c.course_name}</td>
                                            <td style={{ padding: '0.55rem 0.75rem', color: '#444' }}>{c.subject}</td>
                                            <td style={{ padding: '0.55rem 0.75rem', color: '#555' }}>{c.trainer_name || '—'}</td>
                                            <td style={{ padding: '0.55rem 0.75rem', color: '#7f8c8d', fontSize: '0.82rem' }}>{c.school_period_label || '—'}</td>
                                            <td style={{ padding: '0.55rem 0.75rem' }}>
                                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600, background: sc.bg, color: sc.color }}>
                                                    {c.status}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.55rem 0.75rem', color: '#95a5a6', fontSize: '0.8rem' }}>
                                                {new Date(c.created_at).toLocaleDateString('en-GB')}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* New appeal form */}
            <div className="student-card">
                <h3 className="student-card-title">Submit New Grade Appeal</h3>

                {message && <div className="student-ok" style={{ marginBottom: '0.75rem' }}>{message}</div>}
                {error && <div style={{ color: '#e74c3c', fontSize: '0.875rem', marginBottom: '0.75rem' }}>{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Course selector */}
                    <div className="form-field" style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.35rem' }}>
                            Select Course <span style={{ color: '#e74c3c' }}>*</span>
                        </label>
                        {coursesLoading ? (
                            <p style={{ color: '#aaa', fontSize: '0.85rem' }}>Loading courses…</p>
                        ) : (
                            <select
                                value={selectedCourse}
                                onChange={e => setSelectedCourse(e.target.value)}
                                className="student-select"
                                style={{ width: '100%', maxWidth: 400 }}
                            >
                                <option value="">Choose a course with a grade</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.name} ({c.code}) — Grade: {c.grade ?? 'N/A'}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Auto-filled fields */}
                    {courseDetails && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.35rem' }}>Trainer (auto-filled)</label>
                                <input
                                    type="text"
                                    value={courseDetails.trainer_name || 'No trainer assigned'}
                                    disabled
                                    className="student-input"
                                    style={{ width: '100%', background: '#f8f9fa', color: '#555', cursor: 'not-allowed' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.35rem' }}>School Period (auto-filled)</label>
                                <input
                                    type="text"
                                    value={courseDetails.school_period_label || 'Not assigned'}
                                    disabled
                                    className="student-input"
                                    style={{ width: '100%', background: '#f8f9fa', color: '#555', cursor: 'not-allowed' }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div style={{ marginBottom: '0.75rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.35rem' }}>
                            Subject <span style={{ color: '#e74c3c' }}>*</span>
                        </label>
                        <input
                            value={form.subject}
                            onChange={e => setForm({ ...form, subject: e.target.value })}
                            placeholder="Brief subject of your appeal"
                            className="student-input"
                            style={{ width: '100%' }}
                        />
                    </div>

                    {/* Description */}
                    <div style={{ marginBottom: '1rem' }}>
                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50', marginBottom: '0.35rem' }}>Description</label>
                        <textarea
                            rows={4}
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Describe your concern in detail…"
                            className="student-input"
                            style={{ width: '100%', resize: 'vertical' }}
                        />
                    </div>

                    <button type="submit" className="student-btn" disabled={submitting || !selectedCourse || !form.subject}>
                        {submitting ? 'Submitting…' : 'Submit Appeal'}
                    </button>
                    <p style={{ fontSize: '0.78rem', color: '#95a5a6', marginTop: '0.5rem' }}>
                        You can only submit one appeal per course.
                    </p>
                </form>
            </div>
        </div>
    );
}