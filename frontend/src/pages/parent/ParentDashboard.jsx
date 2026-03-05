// FILE: /frontend/src/pages/parent/ParentDashboard.jsx
import { useState, useEffect } from 'react';
import { getMyStudents, getStudentGrades, getStudentTimetable } from '../../api/parentApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00:00', label: '8h–10h' },
    { start: '10:00:00', label: '10h–12h' },
    { start: '13:00:00', label: '13h–15h' },
    { start: '15:00:00', label: '15h–17h' },
    { start: '17:00:00', label: '17h–19h' },
    { start: '19:00:00', label: '19h–21h' },
];

function normT(t) {
    if (!t) return '';
    return t.length === 5 ? t + ':00' : t;
}

const C = '#7c3aed';

export default function ParentDashboard() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    // selection only needed if >1 student
    const [selected, setSelected] = useState(null);
    const [view, setView] = useState('grades');

    const [grades, setGrades] = useState([]);
    const [timetable, setTimetable] = useState([]);
    const [weeks, setWeeks] = useState([]);
    const [selectedWeekId, setSelectedWeekId] = useState('');
    const [dataLoading, setDataLoading] = useState(false);

    useEffect(() => {
        getMyStudents()
            .then(res => {
                const list = res.data.data || [];
                setStudents(list);
                // Auto-select if only one child
                if (list.length === 1) selectStudent(list[0]);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    async function selectStudent(s) {
        setSelected(s);
        setView('grades');
        setDataLoading(true);
        try {
            const [gRes, tRes] = await Promise.all([
                getStudentGrades(s.id),
                getStudentTimetable(s.id),
            ]);
            setGrades(gRes.data.data || []);

            const tData = tRes.data.data || [];
            setTimetable(tData);

            // Extract unique weeks from timetable data
            const weekMap = {};
            tData.forEach(row => {
                if (row.week_id) {
                    weekMap[row.week_id] = { id: row.week_id, label: row.week_label, start_date: row.start_date, end_date: row.end_date };
                }
            });
            const weekList = Object.values(weekMap).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
            setWeeks(weekList);
            setSelectedWeekId(weekList.length ? String(weekList[0].id) : '');
        } catch {
            setGrades([]); setTimetable([]); setWeeks([]);
        } finally {
            setDataLoading(false);
        }
    }

    const filteredTimetable = selectedWeekId
        ? timetable.filter(r => String(r.week_id) === selectedWeekId)
        : timetable;

    function sessionAt(day, slotStart) {
        return filteredTimetable.find(s =>
            s.day_of_week === day && normT(s.time_start) === normT(slotStart)
        );
    }

    const fmt = d => d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const currentWeek = weeks.find(w => String(w.id) === selectedWeekId);

    const cardStyle = { background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '1.25rem', marginBottom: '1rem' };

    // ── If loading ──
    if (loading) return <p style={{ textAlign: 'center', color: '#888', padding: '3rem 0' }}>Loading…</p>;

    // ── No students ──
    if (!students.length) {
        return (
            <div style={{ padding: '2rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: C, marginBottom: '0.5rem' }}>My Children</h1>
                <div style={cardStyle}>
                    <p style={{ color: '#888', textAlign: 'center', padding: '2rem 0' }}>No students are linked to your account.</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1.25rem' }}>
                <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: C, margin: '0 0 0.2rem' }}>My Children</h1>
                <p style={{ fontSize: '0.85rem', color: '#555', margin: 0 }}>
                    {students.length > 1 ? 'Select a child to view their information' : 'View grades and timetable for your child'}
                </p>
            </div>

            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}>

                {/* Student selector — only shown when >1 child */}
                {students.length > 1 && (
                    <div style={{ width: 220, flexShrink: 0 }}>
                        {students.map(s => (
                            <div
                                key={s.id}
                                onClick={() => selectStudent(s)}
                                style={{
                                    padding: '0.85rem 1rem',
                                    border: '1px solid',
                                    borderColor: selected?.id === s.id ? C : '#e5e5e5',
                                    borderRadius: 6,
                                    marginBottom: '0.5rem',
                                    cursor: 'pointer',
                                    background: selected?.id === s.id ? '#f5f3ff' : '#fff',
                                    transition: 'border-color 0.15s',
                                }}
                            >
                                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1a1a2e' }}>{s.full_name}</div>
                                <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>{s.matricule}</div>
                                <div style={{ fontSize: '0.75rem', color: '#888' }}>{s.program_name}</div>
                                <span style={{
                                    display: 'inline-block', marginTop: 4,
                                    padding: '0.1rem 0.45rem', background: '#dcfce7', color: '#166534',
                                    borderRadius: 999, fontSize: '0.7rem', fontWeight: 600,
                                }}>{s.enrollment_status || 'enrolled'}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail panel */}
                {selected && (
                    <div style={{ flex: 1 }}>
                        {/* Student name header */}
                        <div style={{ marginBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1a1a2e', margin: 0 }}>{selected.full_name}</h2>
                            <div style={{ fontSize: '0.8rem', color: '#666' }}>{selected.matricule} · {selected.program_name}</div>
                        </div>

                        {/* Tabs */}
                        <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e5e5e5', marginBottom: '1.25rem' }}>
                            {['grades', 'timetable'].map(t => (
                                <button key={t} onClick={() => setView(t)} style={{
                                    padding: '0.6rem 1.25rem', background: 'none', border: 'none',
                                    borderBottom: view === t ? `2px solid ${C}` : '2px solid transparent',
                                    marginBottom: -2, fontWeight: view === t ? 700 : 400,
                                    color: view === t ? C : '#666', cursor: 'pointer',
                                    fontSize: '0.875rem', textTransform: 'capitalize',
                                }}>{t}</button>
                            ))}
                        </div>

                        {dataLoading ? (
                            <div style={cardStyle}><p style={{ textAlign: 'center', color: '#888', padding: '1.5rem 0' }}>Loading…</p></div>
                        ) : view === 'grades' ? (
                            <div style={cardStyle}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: C, margin: '0 0 1rem' }}>
                                    Grades — {selected.full_name}
                                </h3>
                                {!grades.length ? (
                                    <p style={{ textAlign: 'center', color: '#888', padding: '1rem 0' }}>No grades recorded yet.</p>
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
                                                            <span style={{
                                                                padding: '0.18rem 0.5rem', borderRadius: 999, fontWeight: 700, fontSize: '0.8rem',
                                                                background: parseFloat(g.grade) >= 50 ? '#dcfce7' : '#fee2e2',
                                                                color: parseFloat(g.grade) >= 50 ? '#166534' : '#991b1b',
                                                            }}>{g.grade_letter}</span>
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
                            /* Timetable tab */
                            <div style={cardStyle}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: C, margin: 0 }}>
                                        Timetable — {selected.full_name}
                                    </h3>
                                    {weeks.length > 0 && (
                                        <select
                                            value={selectedWeekId}
                                            onChange={e => setSelectedWeekId(e.target.value)}
                                            style={{ padding: '0.4rem 0.7rem', border: '1px solid #ddd', borderRadius: 4, fontSize: '0.82rem', minWidth: 200 }}
                                        >
                                            {weeks.map(w => (
                                                <option key={w.id} value={w.id}>
                                                    {w.label} ({fmt(w.start_date)} – {fmt(w.end_date)})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                {currentWeek && (
                                    <p style={{ fontSize: '0.78rem', color: '#555', marginBottom: '0.75rem' }}>
                                        {currentWeek.label} · {fmt(currentWeek.start_date)} → {fmt(currentWeek.end_date)}
                                    </p>
                                )}
                                {!filteredTimetable.length ? (
                                    <p style={{ textAlign: 'center', color: '#888', padding: '1rem 0' }}>No published timetable for this week.</p>
                                ) : (
                                    <div style={{ display: 'grid', gridTemplateColumns: '70px repeat(6, 1fr)', border: '1px solid #e5e5e5', borderRadius: 4, overflow: 'hidden', fontSize: '0.75rem' }}>
                                        <div style={{ background: C, color: '#fff', padding: '0.5rem 0.3rem', textAlign: 'center', fontWeight: 700, fontSize: '0.68rem' }}>Time</div>
                                        {DAYS.map(d => (
                                            <div key={d} style={{ background: C, color: '#fff', padding: '0.5rem 0.3rem', textAlign: 'center', fontWeight: 700, fontSize: '0.68rem', borderLeft: '1px solid rgba(255,255,255,0.15)' }}>{d}</div>
                                        ))}
                                        {TIME_SLOTS.map(slot => (
                                            <React.Fragment key={slot.start}>
                                                <div style={{ background: '#f8f9fa', padding: '0.5rem 0.3rem', textAlign: 'center', fontWeight: 600, fontSize: '0.68rem', borderTop: '1px solid #e5e5e5', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444' }}>
                                                    {slot.label}
                                                </div>
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
                                                            ) : <span style={{ color: '#ccc', fontSize: '0.66rem', fontStyle: 'italic' }}>Free</span>}
                                                        </div>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}


import React from 'react';