// FILE: /frontend/src/pages/parent/ParentDashboard.jsx
import { useState } from 'react';
import { getMyStudents, getStudentGrades, getStudentTimetable } from '../../api/parentApi';
import { useEffect } from 'react';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00:00', end: '10:00:00', label: '8h–10h' },
    { start: '10:00:00', end: '12:00:00', label: '10h–12h' },
    { start: '13:00:00', end: '15:00:00', label: '13h–15h' },
    { start: '15:00:00', end: '17:00:00', label: '15h–17h' },
    { start: '17:00:00', end: '19:00:00', label: '17h–19h' },
    { start: '19:00:00', end: '21:00:00', label: '19h–21h' },
];

function normalizeTime(t) {
    if (!t) return '';
    return t.length === 5 ? t + ':00' : t;
}

const cardStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 4, padding: '1.25rem', marginBottom: '1rem' };
const titleStyle = { fontSize: '1.4rem', fontWeight: 700, color: '#7c3aed', margin: '0 0 0.2rem' };

export default function ParentDashboard() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('grades');
    const [grades, setGrades] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        getMyStudents()
            .then(res => { setStudents(res.data.data || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    async function selectStudent(s) {
        setSelected(s);
        setDataLoading(true);
        try {
            const [gRes, tRes] = await Promise.all([getStudentGrades(s.id), getStudentTimetable(s.id)]);
            setGrades(gRes.data.data || []);
            setTimetable(tRes.data.data || []);
        } catch { setGrades([]); setTimetable([]); }
        finally { setDataLoading(false); }
    }

    function sessionAt(day, slotStart) {
        return timetable.find(s =>
            s.day_of_week === day && normalizeTime(s.time_start) === normalizeTime(slotStart)
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                    <h1 style={titleStyle}>My Children</h1>
                    <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>Select a child to view their grades or timetable</p>
                </div>
            </div>

            {loading ? (
                <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>Loading…</p>
            ) : !students.length ? (
                <div style={cardStyle}>
                    <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>No students linked to your account.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>
                    {/* Student list */}
                    <div style={{ width: 240, flexShrink: 0 }}>
                        {students.map(s => (
                            <div
                                key={s.id}
                                onClick={() => selectStudent(s)}
                                style={{
                                    padding: '0.9rem 1rem',
                                    border: '1px solid',
                                    borderColor: selected?.id === s.id ? '#7c3aed' : '#e5e5e5',
                                    borderRadius: 4,
                                    marginBottom: '0.5rem',
                                    cursor: 'pointer',
                                    background: selected?.id === s.id ? '#f5f3ff' : '#fff',
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{s.full_name}</div>
                                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 2 }}>{s.matricule}</div>
                                <div style={{ fontSize: '0.78rem', color: '#888' }}>{s.program_name}</div>
                                <span style={{
                                    display: 'inline-block',
                                    marginTop: 4,
                                    padding: '0.1rem 0.45rem',
                                    background: s.enrollment_status === 'active' ? '#dcfce7' : '#f3f4f6',
                                    color: s.enrollment_status === 'active' ? '#166534' : '#555',
                                    borderRadius: 999,
                                    fontSize: '0.7rem',
                                    fontWeight: 600,
                                }}>
                                    {s.enrollment_status || 'enrolled'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Detail panel */}
                    {selected && (
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e5e5', marginBottom: '1.25rem' }}>
                                {['grades', 'timetable'].map(tab => (
                                    <button key={tab} onClick={() => setView(tab)} style={{
                                        padding: '0.6rem 1.25rem',
                                        background: 'none', border: 'none',
                                        borderBottom: view === tab ? '2px solid #7c3aed' : '2px solid transparent',
                                        marginBottom: -2,
                                        fontWeight: view === tab ? 700 : 400,
                                        color: view === tab ? '#7c3aed' : '#666',
                                        cursor: 'pointer',
                                        fontSize: '0.875rem',
                                        textTransform: 'capitalize',
                                    }}>{tab}</button>
                                ))}
                            </div>

                            {dataLoading ? (
                                <div style={cardStyle}><p style={{ textAlign: 'center', color: '#888', padding: '1.5rem 0' }}>Loading…</p></div>
                            ) : view === 'grades' ? (
                                <div style={cardStyle}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#7c3aed', margin: '0 0 1rem' }}>
                                        {selected.full_name}'s Grades
                                    </h3>
                                    {!grades.length ? (
                                        <p style={{ textAlign: 'center', color: '#888', padding: '1rem 0' }}>No grades yet.</p>
                                    ) : (
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                                            <thead>
                                                <tr>
                                                    {['Subject', 'Trainer', 'Grade', 'Letter', 'Year'].map(h => (
                                                        <th key={h} style={{ textAlign: 'left', padding: '0.5rem 0.6rem', fontSize: '0.72rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', borderBottom: '2px solid #e5e5e5', background: '#fafafa' }}>{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {grades.map(g => (
                                                    <tr key={g.id}>
                                                        <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #efefef' }}><strong>{g.course_name || g.certification_name || '—'}</strong></td>
                                                        <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #efefef', color: '#555' }}>{g.trainer_name || '—'}</td>
                                                        <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #efefef', fontWeight: 700 }}>{g.grade ?? '—'}</td>
                                                        <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #efefef' }}>
                                                            {g.grade_letter && (
                                                                <span style={{ padding: '0.18rem 0.5rem', borderRadius: 999, fontWeight: 700, fontSize: '0.8rem', background: parseFloat(g.grade) >= 50 ? '#dcfce7' : '#fee2e2', color: parseFloat(g.grade) >= 50 ? '#166534' : '#991b1b' }}>
                                                                    {g.grade_letter}
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td style={{ padding: '0.55rem 0.6rem', borderBottom: '1px solid #efefef', fontSize: '0.82rem', color: '#666' }}>{g.academic_year || '—'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            ) : (
                                <div style={cardStyle}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#7c3aed', margin: '0 0 1rem' }}>
                                        {selected.full_name}'s Timetable
                                    </h3>
                                    {!timetable.length ? (
                                        <p style={{ textAlign: 'center', color: '#888', padding: '1rem 0' }}>No published timetable available.</p>
                                    ) : (
                                        <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', border: '1px solid #e5e5e5', borderRadius: 4, overflow: 'hidden', fontSize: '0.75rem' }}>
                                            <div style={{ background: '#7c3aed', color: '#fff', padding: '0.5rem 0.3rem', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem' }}>Time</div>
                                            {DAYS.map(d => <div key={d} style={{ background: '#7c3aed', color: '#fff', padding: '0.5rem 0.3rem', textAlign: 'center', fontWeight: 700, fontSize: '0.7rem', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>{d}</div>)}
                                            {TIME_SLOTS.map(slot => (
                                                <>
                                                    <div key={`t-${slot.start}`} style={{ background: '#f8f9fa', padding: '0.5rem 0.3rem', textAlign: 'center', fontWeight: 600, fontSize: '0.68rem', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>{slot.label}</div>
                                                    {DAYS.map(day => {
                                                        const s = sessionAt(day, slot.start);
                                                        return (
                                                            <div key={`${day}-${slot.start}`} style={{ minHeight: 52, padding: '0.4rem', borderLeft: '1px solid #e5e5e5', borderTop: '1px solid #e5e5e5', background: s ? '#f5f3ff' : '#fafafa', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                                                {s ? (
                                                                    <>
                                                                        <div style={{ fontWeight: 600, fontSize: '0.7rem' }}>{s.course_name}</div>
                                                                        <div style={{ fontSize: '0.62rem', color: '#666' }}>{s.trainer_name}</div>
                                                                        <div style={{ fontSize: '0.6rem', color: '#888' }}>{s.room_name}</div>
                                                                    </>
                                                                ) : <span style={{ color: '#ccc', fontSize: '0.68rem', fontStyle: 'italic' }}>Free</span>}
                                                            </div>
                                                        );
                                                    })}
                                                </>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}