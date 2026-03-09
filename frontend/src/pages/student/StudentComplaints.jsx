import { useState, useEffect } from 'react';
import {
    getCourseDetails,
    submitMarkComplaint,
    getMarkComplaintsHistory,
} from '../../api/studentApi';
import '../../styles/Student.css';

export default function StudentComplaints() {
    const [activeTab, setActiveTab] = useState('submit');

    // Form state
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [courseDetails, setCourseDetails] = useState(null);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // History state
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);

    useEffect(() => {
        getAppealCourses()
            .then(res => {
                setCourses(res.data.data || []);
                setCoursesLoading(false);
            })
            .catch(() => setCoursesLoading(false));
    }, []);

    useEffect(() => {
        if (activeTab === 'history') {
            setHistoryLoading(true);
            getMarkComplaintsHistory()
                .then(res => setHistory(res.data.data || []))
                .catch(() => setHistory([]))
                .finally(() => setHistoryLoading(false));
        }
    }, [activeTab]);

    
    useEffect(() => {
        if (!selectedCourseId) { setCourseDetails(null); return; }
        getCourseDetails(selectedCourseId)
            .then(res => setCourseDetails(res.data.data))
            .catch(() => setCourseDetails(null));
    }, [selectedCourseId]);

    async function handleSubmit() {
        if (!selectedCourseId || !subject.trim()) {
            setSubmitError('Please select a course and enter a subject.');
            return;
        }
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');
        try {
            await submitMarkComplaint({ courseId: parseInt(selectedCourseId), subject, description });
            setSubmitSuccess('Grade appeal submitted successfully!');
            setSelectedCourseId('');
            setCourseDetails(null);
            setSubject('');
            setDescription('');
            // Refresh courses list (submitted course should no longer appear)
            const res = await getAppealCourses();
            setCourses(res.data.data || []);
            setTimeout(() => setSubmitSuccess(''), 5000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Submission failed';
            setSubmitError(msg);
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div>
            <div className="student-page-head">
                <h1 className="student-title">Grade Appeals</h1>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 0, marginBottom: '1.25rem', borderBottom: '2px solid #e5e5e5' }}>
                {['submit', 'history'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{
                            padding: '0.6rem 1.25rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: activeTab === tab ? '2px solid #0f4c3a' : '2px solid transparent',
                            marginBottom: -2,
                            fontWeight: activeTab === tab ? 700 : 400,
                            color: activeTab === tab ? '#0f4c3a' : '#666',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            textTransform: 'capitalize',
                        }}
                    >
                        {tab === 'submit' ? 'Submit Appeal' : 'My Appeals History'}
                    </button>
                ))}
            </div>

            {activeTab === 'submit' && (
                <div className="student-card">
                    <h3 className="student-card-title">Submit Grade Appeal</h3>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1.25rem' }}>
                        You can submit only one appeal per course. Select the course the complaint is about.
                    </p>

                    {submitError && (
                        <div className="student-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                            {submitError}
                        </div>
                    )}
                    {submitSuccess && (
                        <div className="student-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                            {submitSuccess}
                        </div>
                    )}

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 560 }}>
                        {/* Course selector */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
                                Course *
                            </label>
                            {coursesLoading ? (
                                <div className="student-msg" style={{ textAlign: 'left', padding: '0.5rem 0' }}>Loading courses…</div>
                            ) : !courses.length ? (
                                <div style={{ fontSize: '0.875rem', color: '#888' }}>No courses with grades available for appeal.</div>
                            ) : (
                                <select
                                    className="student-select"
                                    value={selectedCourseId}
                                    onChange={e => setSelectedCourseId(e.target.value)}
                                    style={{ width: '100%' }}
                                >
                                    <option value="">— Select a course —</option>
                                    {courses.map(c => (
                                        <option key={c.id} value={c.id}>
                                            {c.name} ({c.code}) — Grade: {c.grade} {c.grade_letter}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>

                        {/* Auto-filled: Trainer name */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
                                Trainer in charge
                            </label>
                            <input
                                className="student-input"
                                style={{ width: '100%', background: '#f0f2f5', cursor: 'not-allowed' }}
                                value={courseDetails?.trainer_name || (selectedCourseId ? 'No trainer assigned' : '')}
                                readOnly
                                placeholder="Select a course first"
                            />
                        </div>

                        {/* Auto-filled: School period */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
                                School Period 
                            </label>
                            <input
                                className="student-input"
                                style={{ width: '100%', background: '#f0f2f5', cursor: 'not-allowed' }}
                                value={courseDetails?.school_period_label || (selectedCourseId ? 'Not assigned' : '')}
                                readOnly
                                placeholder="Select a course first"
                            />
                        </div>

                        {/* Subject */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
                                Subject *
                            </label>
                            <input
                                className="student-input"
                                style={{ width: '100%' }}
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Brief subject of your appeal"
                            />
                        </div>

                        {/* Description */}
                        <div>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: '0.4rem' }}>
                                Description
                            </label>
                            <textarea
                                className="student-textarea"
                                rows={4}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="Describe your grade appeal in detail…"
                            />
                        </div>

                        <button
                            className="student-btn"
                            onClick={handleSubmit}
                            disabled={submitting || !selectedCourseId || !subject.trim()}
                            style={{ alignSelf: 'flex-start' }}
                        >
                            {submitting ? 'Submitting…' : 'Submit Appeal'}
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'history' && (
                <div className="student-card">
                    <h3 className="student-card-title">My Grade Appeals History</h3>
                    {historyLoading ? (
                        <div className="student-msg">Loading…</div>
                    ) : !history.length ? (
                        <div className="student-msg">You have not submitted any grade appeals yet.</div>
                    ) : (
                        <div style={{ overflowX: 'auto' }}>
                            <table className="student-table">
                                <thead>
                                    <tr>
                                        <th>Course</th>
                                        <th>School Period</th>
                                        <th>Trainer</th>
                                        <th>Subject</th>
                                        <th>Status</th>
                                        <th>Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map(h => (
                                        <tr key={h.id}>
                                            <td>
                                                <strong>{h.course_name || '—'}</strong>
                                                {h.course_code && <div style={{ fontSize: '0.75rem', color: '#888' }}>{h.course_code}</div>}
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#666' }}>{h.school_period_label || '—'}</td>
                                            <td style={{ fontSize: '0.875rem' }}>{h.trainer_name || '—'}</td>
                                            <td>{h.subject}</td>
                                            <td>
                                                <span className={`status-badge status-${h.status}`}>
                                                    {h.status}
                                                </span>
                                            </td>
                                            <td style={{ fontSize: '0.82rem', color: '#666' }}>
                                                {new Date(h.created_at).toLocaleDateString('en-GB')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}