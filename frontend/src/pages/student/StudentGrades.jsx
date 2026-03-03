// FILE: /frontend/src/pages/student/StudentGrades.jsx
import { useState, useEffect } from 'react';
import { getGrades, getGradePeriods } from '../../api/studentApi';
import Badge from '../../components/Badge';
import '../../styles/Student.css';

export default function StudentGrades() {
    const [periods, setPeriods] = useState([]);
    const [periodsLoading, setPeriodsLoading] = useState(true);
    const [selectedPeriodId, setSelectedPeriodId] = useState('');
    const [grades, setGrades] = useState([]);
    const [gradesLoading, setGradesLoading] = useState(false);

    useEffect(() => {
        getGradePeriods()
            .then(res => {
                const p = res.data.data || [];
                setPeriods(p);
                if (p.length) setSelectedPeriodId(String(p[0].id));
                setPeriodsLoading(false);
            })
            .catch(() => setPeriodsLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedPeriodId) { setGrades([]); return; }
        setGradesLoading(true);
        getGrades({ periodId: selectedPeriodId })
            .then(res => setGrades(res.data.data || []))
            .catch(() => setGrades([]))
            .finally(() => setGradesLoading(false));
    }, [selectedPeriodId]);

    const currentPeriod = periods.find(p => String(p.id) === selectedPeriodId);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '';

    return (
        <div>
            <div className="student-page-head">
                <h1 className="student-title">My Grades</h1>
            </div>

            {periodsLoading ? (
                <div className="student-msg">Loading periods…</div>
            ) : !periods.length ? (
                <div className="student-card">
                    <p className="student-msg">No school periods available yet.</p>
                </div>
            ) : (
                <div className="student-card">
                    <div className="student-row" style={{ marginBottom: '1rem' }}>
                        <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#2c3e50' }}>Select School Period:</label>
                        <select
                            className="student-select"
                            value={selectedPeriodId}
                            onChange={e => setSelectedPeriodId(e.target.value)}
                        >
                            {periods.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.label} ({formatDate(p.start_date)} – {formatDate(p.end_date)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {currentPeriod && (
                        <p style={{ fontSize: '0.82rem', color: '#7f8c8d', marginBottom: '0.75rem' }}>
                            <strong style={{ color: '#2c3e50' }}>{currentPeriod.label}</strong>
                            &nbsp;·&nbsp; {formatDate(currentPeriod.start_date)} – {formatDate(currentPeriod.end_date)}
                        </p>
                    )}

                    {gradesLoading ? (
                        <div className="student-msg">Loading grades…</div>
                    ) : !grades.length ? (
                        <div className="empty-state" style={{ textAlign: 'center', padding: '2rem 0' }}>
                            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📊</div>
                            <p style={{ color: '#7f8c8d', fontSize: '0.9rem' }}>No grades recorded for this school period</p>
                        </div>
                    ) : (
                        <div className="hod-table-wrap">
                            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left', padding: '0.55rem 0.75rem', borderBottom: '2px solid #e0e0e0', color: '#555', textTransform: 'uppercase', fontSize: '0.73rem', letterSpacing: '0.04em' }}>Course</th>
                                        <th style={{ textAlign: 'left', padding: '0.55rem 0.75rem', borderBottom: '2px solid #e0e0e0', color: '#555', textTransform: 'uppercase', fontSize: '0.73rem', letterSpacing: '0.04em' }}>Trainer</th>
                                        <th style={{ textAlign: 'left', padding: '0.55rem 0.75rem', borderBottom: '2px solid #e0e0e0', color: '#555', textTransform: 'uppercase', fontSize: '0.73rem', letterSpacing: '0.04em' }}>Grade</th>
                                        <th style={{ textAlign: 'left', padding: '0.55rem 0.75rem', borderBottom: '2px solid #e0e0e0', color: '#555', textTransform: 'uppercase', fontSize: '0.73rem', letterSpacing: '0.04em' }}>Letter</th>
                                        <th style={{ textAlign: 'left', padding: '0.55rem 0.75rem', borderBottom: '2px solid #e0e0e0', color: '#555', textTransform: 'uppercase', fontSize: '0.73rem', letterSpacing: '0.04em' }}>School Period</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {grades.map(g => (
                                        <tr key={g.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                            <td style={{ padding: '0.6rem 0.75rem', color: '#222' }}>{g.course_name || g.certification_name}</td>
                                            <td style={{ padding: '0.6rem 0.75rem', color: '#555' }}>{g.trainer_name || '—'}</td>
                                            <td style={{ padding: '0.6rem 0.75rem', fontWeight: 600, color: '#2c3e50' }}>{g.grade ?? '—'}</td>
                                            <td style={{ padding: '0.6rem 0.75rem' }}><Badge label={g.grade_letter || '—'} /></td>
                                            <td style={{ padding: '0.6rem 0.75rem', color: '#7f8c8d', fontSize: '0.82rem' }}>{g.school_period || currentPeriod?.label}</td>
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