import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getCertifications, getCertificationStudents, submitGrades } from '../../api/trainerApi';
import '../../styles/Trainer.css';

function gradeToLetter(n) {
    if (n >= 90) return 'A+';
    if (n >= 85) return 'A';
    if (n >= 80) return 'A-';
    if (n >= 75) return 'B+';
    if (n >= 70) return 'B';
    if (n >= 65) return 'B-';
    if (n >= 60) return 'C+';
    if (n >= 55) return 'C';
    if (n >= 50) return 'D';
    return 'F';
}

export default function TrainerCertifications() {
    const { data: certs, loading } = useFetch(getCertifications);
    const [selectedCert, setSelectedCert] = useState(null);
    const [students, setStudents] = useState([]);
    const [studentsLoading, setStudentsLoading] = useState(false);
    const [gradeInputs, setGradeInputs] = useState({});
    const [savingId, setSavingId] = useState(null);
    const [messages, setMessages] = useState({});
    const [globalMsg, setGlobalMsg] = useState('');
    const [globalErr, setGlobalErr] = useState('');

    async function selectCert(cert) {
        setSelectedCert(cert);
        setStudents([]);
        setGradeInputs({});
        setMessages({});
        setGlobalMsg('');
        setGlobalErr('');
        setStudentsLoading(true);
        try {
            const res = await getCertificationStudents(cert.id);
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

    async function handleSaveOne(studentId) {
        const grade = parseFloat(gradeInputs[studentId]);
        if (isNaN(grade) || grade < 0 || grade > 100) {
            setMessages(prev => ({ ...prev, [studentId]: { type: 'error', text: 'Enter 0–100' } }));
            return;
        }
        setSavingId(studentId);
        setMessages(prev => ({ ...prev, [studentId]: null }));
        try {
            await submitGrades({
                studentId: parseInt(studentId),
                certificationId: selectedCert.id,
                grade,
            });
            setMessages(prev => ({ ...prev, [studentId]: { type: 'ok', text: '✓ Saved' } }));
            const res = await getCertificationStudents(selectedCert.id);
            setStudents(res.data.data || []);
        } catch (err) {
            setMessages(prev => ({ ...prev, [studentId]: { type: 'error', text: err.response?.data?.message || 'Save failed' } }));
        } finally {
            setSavingId(null);
        }
    }

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
                await submitGrades({ studentId: parseInt(studentId), certificationId: selectedCert.id, grade });
                ok++;
            } catch { fail++; }
        }
        if (ok > 0) {
            setGlobalMsg(`${ok} grade(s) saved${fail > 0 ? `, ${fail} failed` : ''}.`);
            const res = await getCertificationStudents(selectedCert.id);
            setStudents(res.data.data || []);
        } else {
            setGlobalErr(`All ${fail} grade(s) failed.`);
        }
    }

    // Certification list view
    if (!selectedCert) {
        return (
            <div>
                <div className="trainer-page-head">
                    <div>
                        <h1 className="trainer-title">Certifications</h1>
                        <p className="trainer-sub">Select a certification to  enter grades</p>
                    </div>
                </div>
                {loading ? (
                    <div className="trainer-msg">Loading…</div>
                ) : !certs?.length ? (
                    <div className="trainer-card">
                        <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}></div>
                            <div style={{ fontWeight: 600 }}>No certifications assigned to you yet</div>
                        </div>
                    </div>
                ) : (
                    <div className="trainer-card">
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {certs.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => selectCert(c)}
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
                                            {c.code} · {c.duration_hours}h total
                                        </div>
                                    </div>
                                    <span style={{ color: '#3b5be8', fontSize: '1.1rem' }}>›</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Student detail view 
    return (
        <div>
            <div className="trainer-page-head">
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setSelectedCert(null)}
                        style={{
                            background: 'none', border: '1.5px solid #cbd5e1', borderRadius: 6,
                            padding: '0.35rem 0.75rem', cursor: 'pointer', fontSize: '0.85rem', color: '#475569',
                        }}
                    >
                        ← Back
                    </button>
                    <div>
                        <h1 className="trainer-title">{selectedCert.name}</h1>
                        <p className="trainer-sub">{selectedCert.code} · {selectedCert.duration_hours}h</p>
                    </div>
                </div>
                {students.length > 0 && (
                    <button className="trainer-btn" onClick={handleSaveAll}>Save All Grades</button>
                )}
            </div>

            {globalMsg && <div className="trainer-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>{globalMsg}</div>}
            {globalErr && <div className="trainer-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>{globalErr}</div>}

            <div className="trainer-card">
                {studentsLoading ? (
                    <div className="trainer-msg">Loading students…</div>
                ) : students.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem 0', color: '#94a3b8' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>👤</div>
                        <div style={{ fontWeight: 600 }}>No students enrolled to this certification</div>
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
                                                    {s.grade !== null && s.grade !== undefined ? <span style={{ fontWeight: 700 }}>{s.grade}</span> : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    {s.grade_letter ? (
                                                        <span style={{ padding: '2px 8px', borderRadius: 999, fontSize: '0.78rem', fontWeight: 700, background: '#e0e7ff', color: '#3730a3' }}>{s.grade_letter}</span>
                                                    ) : <span style={{ color: '#cbd5e1' }}>—</span>}
                                                </td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <input
                                                        type="number" min="0" max="100" step="0.5"
                                                        value={inputVal}
                                                        onChange={e => {
                                                            setGradeInputs(prev => ({ ...prev, [s.student_id]: e.target.value }));
                                                            setMessages(prev => ({ ...prev, [s.student_id]: null }));
                                                        }}
                                                        style={{ width: 80, padding: '4px 8px', border: '1.5px solid #cbd5e1', borderRadius: 5, textAlign: 'center' }}
                                                    />
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: 600, color: '#3b5be8' }}>{preview}</td>
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
                                                        {msg && <span style={{ fontSize: '0.78rem', color: msg.type === 'ok' ? '#16a34a' : '#dc2626', fontWeight: 600 }}>{msg.text}</span>}
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