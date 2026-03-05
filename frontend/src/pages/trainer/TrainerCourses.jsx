import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getCourses, getCourseStudents, submitGrades } from '../../api/trainerApi';
import { gradeToLetter } from '../../helpers/gpa';
import '../../styles/Trainer.css';

export default function TrainerCourses() {
    const { data: courses, loading } = useFetch(getCourses);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [gradeInputs, setGradeInputs] = useState({});
    const [savingId, setSavingId] = useState(null); // per-student save state
    const [messages, setMessages] = useState({});   // per-student message
    const [globalMsg, setGlobalMsg] = useState('');
    const [globalErr, setGlobalErr] = useState('');

    async function selectCourse(course) {
        setSelectedCourse(course);
        setStudents([]);
        setGradeInputs({});
        setMessages({});
        setGlobalMsg('');
        setGlobalErr('');
        setStudentsLoading(true);
        try {
            const res = await getCourseStudents(course.id);
            const studs = res.data.data || [];
            setStudents(studs);
            const inputs = {};
            studs.forEach(s => { inputs[s.student_id] = s.grade !== null && s.grade !== undefined ? String(s.grade) : ''; });
            setGradeInputs(inputs);
        } catch {
            setGlobalErr('Failed to load students');
        } finally {
            setStudentsLoading(false);
        }
    }

    // Save a single student's grade immediately
    async function handleSaveOne(studentId) {
        const grade = parseFloat(gradeInputs[studentId]);
        if (isNaN(grade) || grade < 0 || grade > 100) {
            setMessages(prev => ({ ...prev, [studentId]: { type: 'error', text: 'Enter a valid grade (0–100)' } }));
            return;
        }
        setSavingId(studentId);
        setMessages(prev => ({ ...prev, [studentId]: null }));
        try {
            await submitGrades({
                studentId: parseInt(studentId),
                courseId: selectedCourse.id,
                grade,
            });
            setMessages(prev => ({ ...prev, [studentId]: { type: 'ok', text: '✓ Saved' } }));
            // Refresh students list to get updated grade_letter
            const res = await getCourseStudents(selectedCourse.id);
            const studs = res.data.data || [];
            setStudents(studs);
        } catch (err) {
            setMessages(prev => ({ ...prev, [studentId]: { type: 'error', text: err.response?.data?.message || 'Save failed' } }));
        } finally {
            setSavingId(null);
        }
    }

    // Save all at once
    async function handleSaveAll() {
        setGlobalMsg('');
        setGlobalErr('');
        const entries = Object.entries(gradeInputs).filter(([, v]) => v !== '');
        if (!entries.length) { setGlobalErr('No grades entered.'); return; }

        let ok = 0, fail = 0;
        for (const [studentId, gradeStr] of entries) {
            const grade = parseFloat(gradeStr);
            if (isNaN(grade)) { fail++; continue; }
            try {
                await submitGrades({
                    studentId: parseInt(studentId),
                    courseId: selectedCourse.id,
                    grade,
                });
                ok++;
            } catch { fail++; }
        }
        if (ok > 0) {
            setGlobalMsg(`${ok} grade(s) saved successfully${fail > 0 ? `, ${fail} failed` : ''}.`);
            // Refresh
            const res = await getCourseStudents(selectedCourse.id);
            setStudents(res.data.data || []);
        } else {
            setGlobalErr(`All ${fail} grade(s) failed to save.`);
        }
    }

    // ── Course list view ──────────────────────────────────────────────────────
    if (!selectedCourse) {
        return (
            <div>
                <div className="trainer-page-head">
                    <div>
                        <h1 className="trainer-title">Academic Program Courses</h1>
                        <p className="trainer-sub">Select a course to view enrolled students and enter grades</p>
                    </div>
                </div>

                {loading ? (
                    <div className="trainer-msg">Loading courses…</div>
                ) : !courses?.length ? (
                    <div className="trainer-card">
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📚</div>
                            <div style={{ fontWeight: 600 }}>No courses assigned to you yet</div>
                        </div>
                    </div>
                ) : (
                    <div className="trainer-card">
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {courses.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => selectCourse(c)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        padding: '1rem 1.25rem',
                                        borderRadius: 8,
                                        border: '1px solid #e5e7eb',
                                        cursor: 'pointer',
                                        background: '#fff',
                                        transition: 'all 0.15s',
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                                    onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                                >
                                    <div>
                                        <div style={{ fontWeight: 700, color: '#1a1a2e', fontSize: '0.95rem' }}>{c.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 3 }}>
                                            {c.code}
                                            {c.program_name && ` · ${c.program_name}`}
                                            {c.level_name && ` · ${c.level_name}`}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                                            {c.credits} cr · {c.hours_per_week}h/wk
                                        </span>
                                        <span style={{ color: '#3b5be8', fontSize: '1.1rem' }}>›</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── Student detail page ───────────────────────────────────────────────────
    return (
        <div>
            {/* Header with back button */}
            <div className="trainer-page-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setSelectedCourse(null)}
                        style={{
                            background: 'none',
                            border: '1.5px solid #cbd5e1',
                            borderRadius: 6,
                            padding: '0.35rem 0.75rem',
                            cursor: 'pointer',
                            fontSize: '0.85rem',
                            color: '#475569',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                        }}
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="trainer-title">{selectedCourse.name}</h1>
                        <p className="trainer-sub">
                            {selectedCourse.code}
                            {selectedCourse.program_name && ` · ${selectedCourse.program_name}`}
                            {selectedCourse.level_name && ` · ${selectedCourse.level_name}`}
                        </p>
                    </div>
                </div>
                {students.length > 0 && (
                    <button className="trainer-btn" onClick={handleSaveAll}>
                        Save All Grades
                    </button>
                )}
            </div>

            {/* Global messages */}
            {globalMsg && (
                <div className="trainer-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                    {globalMsg}
                </div>
            )}
            {globalErr && (
                <div className="trainer-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>
                    {globalErr}
                </div>
            )}

            <div className="trainer-card">
                {studentsLoading ? (
                    <div className="trainer-msg">Loading students…</div>
                ) : students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
                        <div style={{ fontWeight: 600 }}>No students enrolled in this course</div>
                    </div>
                ) : (
                    <>
                        <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
                        </div>
                        <div className="hod-table-wrap">
                            <table className="hod-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr>
                                        <th style={{ textAlign: 'left' }}>Student Name</th>
                                        <th style={{ textAlign: 'left' }}>Matricule</th>
                                        <th>Current Grade</th>
                                        <th>Letter</th>
                                        <th>New Grade (/100)</th>
                                        <th>Preview</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {students.map(s => {
                                        const inputVal = gradeInputs[s.student_id] ?? '';
                                        const preview = inputVal !== '' && !isNaN(parseFloat(inputVal))
                                            ? gradeToLetter(parseFloat(inputVal)) : '—';
                                        const msg = messages[s.student_id];
                                        const isSaving = savingId === s.student_id;
                                        return (
                                            <tr key={s.student_id}>
                                                <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{s.matricule}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {s.grade !== null && s.grade !== undefined
                                                        ? <span style={{ fontWeight: 700 }}>{s.grade}</span>
                                                        : <span style={{ color: '#cbd5e1' }}>—</span>
                                                    }
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {s.grade_letter
                                                        ? <span style={{
                                                            padding: '2px 8px', borderRadius: 999, fontSize: '0.78rem',
                                                            fontWeight: 700, background: '#e0e7ff', color: '#3730a3',
                                                          }}>{s.grade_letter}</span>
                                                        : <span style={{ color: '#cbd5e1' }}>—</span>
                                                    }
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        step="0.5"
                                                        value={inputVal}
                                                        onChange={e => {
                                                            setGradeInputs(prev => ({ ...prev, [s.student_id]: e.target.value }));
                                                            setMessages(prev => ({ ...prev, [s.student_id]: null }));
                                                        }}
                                                        style={{
                                                            width: 80,
                                                            padding: '4px 8px',
                                                            border: '1.5px solid #cbd5e1',
                                                            borderRadius: 5,
                                                            textAlign: 'center',
                                                            fontSize: '0.9rem',
                                                        }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600, color: '#3b5be8' }}>
                                                    {preview}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center' }}>
                                                        <button
                                                            className="trainer-btn"
                                                            style={{ padding: '4px 14px', fontSize: '0.8rem' }}
                                                            onClick={() => handleSaveOne(s.student_id)}
                                                            disabled={isSaving || inputVal === ''}
                                                        >
                                                            {isSaving ? '…' : 'Save'}
                                                        </button>
                                                        {msg && (
                                                            <span style={{
                                                                fontSize: '0.78rem',
                                                                color: msg.type === 'ok' ? '#16a34a' : '#dc2626',
                                                                fontWeight: 600,
                                                            }}>
                                                                {msg.text}
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}