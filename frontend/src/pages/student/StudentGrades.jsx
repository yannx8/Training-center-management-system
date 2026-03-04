// FILE: /frontend/src/pages/student/StudentGrades.jsx
import { useState, useEffect } from 'react';
import { getGrades, getGradePeriods } from '../../api/studentApi';
import '../../styles/Student.css';

function gradePillClass(letter) {
    if (!letter) return '';
    if (letter.startsWith('A')) return 'A';
    if (letter.startsWith('B')) return 'B';
    if (letter.startsWith('C')) return 'C';
    if (letter.startsWith('D')) return 'D';
    return 'F';
}

export default function StudentGrades() {
    const [periods, setPeriods] = useState([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState('');
    const [grades, setGrades] = useState([]);
    const [loading, setLoading] = useState(false);
    const [periodsLoading, setPeriodsLoading] = useState(true);

    useEffect(() => {
        getGradePeriods()
            .then(res => {
                const p = res.data.data || [];
                setPeriods(p);
                // Don't auto-select — let user choose
                setPeriodsLoading(false);
            })
            .catch(() => setPeriodsLoading(false));
    }, []);

    useEffect(() => {
        setLoading(true);
        getGrades(selectedPeriodId ? { periodId: selectedPeriodId } : {})
            .then(res => setGrades(res.data.data || []))
            .catch(() => setGrades([]))
            .finally(() => setLoading(false));
    }, [selectedPeriodId]);

    const gpa = grades.length
        ? (grades.reduce((acc, g) => acc + (parseFloat(g.grade) || 0), 0) / grades.length).toFixed(2)
        : '—';

    const passed = grades.filter(g => parseFloat(g.grade) >= 50).length;

    return (
        <div>
            <div className="student-page-head">
                <div>
                    <h1 className="student-title">My Grades</h1>
                    <p className="student-sub">Select a school period to filter your grades</p>
                </div>
            </div>

            {/* Stats */}
            <div className="student-stats">
                <div className="student-stat">
                    <div className="student-stat-value">{grades.length}</div>
                    <div className="student-stat-label">Courses Graded</div>
                </div>
                <div className="student-stat">
                    <div className="student-stat-value">{gpa}</div>
                    <div className="student-stat-label">Average Grade</div>
                </div>
                <div className="student-stat">
                    <div className="student-stat-value">{passed}</div>
                    <div className="student-stat-label">Courses Passed</div>
                </div>
            </div>

            <div className="student-card">
                {/* Period filter */}
                <div className="student-row" style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#0f4c3a', whiteSpace: 'nowrap' }}>
                        School Period:
                    </label>
                    <select
                        className="student-select"
                        value={selectedPeriodId}
                        onChange={e => setSelectedPeriodId(e.target.value)}
                        style={{ flex: 1, maxWidth: 400 }}
                    >
                        <option value="">— All Periods —</option>
                        {periods.map(p => (
                            <option key={p.id} value={p.id}>{p.label}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className="student-msg">Loading grades…</div>
                ) : !grades.length ? (
                    <div className="student-msg">
                        {selectedPeriodId ? 'No grades found for this school period.' : 'No grades available yet.'}
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="student-table">
                            <thead>
                                <tr>
                                    <th>Course / Certification</th>
                                    <th>School Period</th>
                                    <th>Trainer</th>
                                    <th>Grade</th>
                                    <th>Letter</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {grades.map(g => (
                                    <tr key={g.id}>
                                        <td>
                                            <strong>{g.course_name || g.certification_name || '—'}</strong>
                                            {(g.course_code || g.certification_code) && (
                                                <div style={{ fontSize: '0.75rem', color: '#888' }}>
                                                    {g.course_code || g.certification_code}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ fontSize: '0.82rem', color: '#666' }}>
                                            {g.school_period || g.academic_year || '—'}
                                        </td>
                                        <td style={{ fontSize: '0.875rem' }}>{g.trainer_name || '—'}</td>
                                        <td style={{ fontWeight: 700, fontSize: '1rem' }}>{g.grade ?? '—'}</td>
                                        <td>
                                            {g.grade_letter ? (
                                                <span className={`grade-pill ${gradePillClass(g.grade_letter)}`}>
                                                    {g.grade_letter}
                                                </span>
                                            ) : '—'}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${parseFloat(g.grade) >= 50 ? 'status-reviewed' : 'status-pending'}`}>
                                                {parseFloat(g.grade) >= 50 ? 'Passed' : 'Failed'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}