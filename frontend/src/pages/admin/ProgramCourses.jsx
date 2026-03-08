// FILE: /frontend/src/pages/admin/ProgramCourses.jsx
// Opened when admin clicks "View Courses" on a program. Uses React Router param.
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProgramCourses, getProgramSessions, createCourse, updateCourse, deleteCourse, assignTrainer, getTrainersByDept, getPrograms } from '../../api/adminApi';
import Modal from '../../components/Modal';
import Table from '../../components/Table';
import '../../styles/Page.css';

const emptyCourse = { name: '', code: '', credits: 3, hoursPerWeek: 2, sessionId: '', trainerId: '' };

export default function ProgramCourses() {
    const { programId } = useParams();
    const navigate = useNavigate();

    const [program, setProgram] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [courses, setCourses] = useState([]);
    const [trainers, setTrainers] = useState([]);
    const [activeSession, setActiveSession] = useState(null); // null = all
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(emptyCourse);
    const [error, setError] = useState('');

    const load = async () => {
        setLoading(true);
        try {
            const [progRes, sessRes, courseRes] = await Promise.all([
                getPrograms(),
                getProgramSessions(programId),
                getProgramCourses(programId),
            ]);
            const prog = (progRes.data.data || []).find(p => String(p.id) === String(programId));
            setProgram(prog || null);
            setSessions(sessRes.data.data || []);
            setCourses(courseRes.data.data || []);

            // Load trainers for this dept
            if (prog?.department_id) {
                const trRes = await getTrainersByDept(prog.department_id);
                setTrainers(trRes.data.data || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [programId]);

    const visibleCourses = activeSession
        ? courses.filter(c => String(c.session_id) === String(activeSession))
        : courses;

    function openCreate() {
        setEditItem(null);
        setForm({ ...emptyCourse, sessionId: activeSession || (sessions[0]?.id || '') });
        setError('');
        setShowModal(true);
    }

    function openEdit(c) {
        setEditItem(c);
        setForm({ name: c.name, code: c.code, credits: c.credits, hoursPerWeek: c.hours_per_week || 2, sessionId: c.session_id, trainerId: c.trainer_id || '' });
        setError('');
        setShowModal(true);
    }

    async function handleSubmit() {
        if (!form.name || !form.code || !form.sessionId) { setError('Name, code, and semester are required.'); return; }
        try {
            let courseId;
            if (editItem) {
                await updateCourse(editItem.id, { name: form.name, code: form.code, credits: form.credits, hoursPerWeek: form.hoursPerWeek });
                courseId = editItem.id;
            } else {
                const res = await createCourse({ name: form.name, code: form.code, credits: form.credits, hoursPerWeek: form.hoursPerWeek, sessionId: form.sessionId });
                courseId = res.data.data?.id;
            }
            // Assign trainer if selected
            if (form.trainerId && courseId) {
                await assignTrainer(courseId, { trainerId: form.trainerId });
            }
            setShowModal(false);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save course.');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this course?')) return;
        try { await deleteCourse(id); load(); }
        catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
    }

    const columns = [
        { key: 'name', label: 'Course Name' },
        { key: 'code', label: 'Code' },
        { key: 'session_name', label: 'Semester' },
        { key: 'credits', label: 'Credits' },
        { key: 'hours_per_week', label: 'Hrs/Week' },
        { key: 'trainer_name', label: 'Trainer', render: r => r.trainer_name || <span style={{ color: '#aaa' }}>Unassigned</span> },
        {
            key: 'actions', label: 'Actions', render: r => (
                <div className="action-btns">
                    <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
            )
        },
    ];

    if (loading) return <div className="page-loading">Loading…</div>;

    return (
        <div>
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <div>
                    <button
                        onClick={() => navigate('/admin/programs')}
                        style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: '0.875rem', padding: 0, marginBottom: '0.5rem' }}
                    >
                        ← Back to Programs
                    </button>
                    <h1 className="page-title">{program?.name || 'Program'} — Courses</h1>
                    <p className="page-subtitle">Manage courses by semester. Assign trainers to each course.</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Add Course</button>
            </div>

            {/* Semester tabs */}
            {sessions.length > 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => setActiveSession(null)}
                        className={!activeSession ? 'btn-primary' : 'btn-secondary'}
                        style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}
                    >
                        All ({courses.length})
                    </button>
                    {sessions.map(s => {
                        const count = courses.filter(c => String(c.session_id) === String(s.id)).length;
                        return (
                            <button
                                key={s.id}
                                onClick={() => setActiveSession(s.id)}
                                className={String(activeSession) === String(s.id) ? 'btn-primary' : 'btn-secondary'}
                                style={{ fontSize: '0.82rem', padding: '0.35rem 0.9rem' }}
                            >
                                {s.session_name || s.name || `Sem ${s.semester_number}`} ({count})
                            </button>
                        );
                    })}
                </div>
            )}

            <div className="table-card">
                <Table columns={columns} rows={visibleCourses} emptyMessage="No courses in this semester." />
            </div>

            {showModal && (
                <Modal title={editItem ? 'Edit Course' : 'Add Course'} onClose={() => setShowModal(false)}>
                    <div className="form-field">
                        <label>Course Name *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Database Systems" />
                    </div>
                    <div className="form-field">
                        <label>Code *</label>
                        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS301" />
                    </div>
                    {!editItem && (
                        <div className="form-field">
                            <label>Semester *</label>
                            <select value={form.sessionId} onChange={e => setForm({ ...form, sessionId: e.target.value })}>
                                <option value="">Select semester</option>
                                {sessions.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.session_name || s.name || `Sem ${s.semester_number}`}{s.level_name ? ` — ${s.level_name}` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div className="form-field" style={{ flex: 1 }}>
                            <label>Credits</label>
                            <input type="number" min={1} value={form.credits} onChange={e => setForm({ ...form, credits: e.target.value })} />
                        </div>
                        <div className="form-field" style={{ flex: 1 }}>
                            <label>Hours / Week</label>
                            <input type="number" min={1} value={form.hoursPerWeek} onChange={e => setForm({ ...form, hoursPerWeek: e.target.value })} />
                        </div>
                    </div>
                    <div className="form-field">
                        <label>Assign Trainer</label>
                        <select value={form.trainerId} onChange={e => setForm({ ...form, trainerId: e.target.value })}>
                            <option value="">— No trainer —</option>
                            {trainers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                        </select>
                    </div>
                    {error && <div className="form-error">{error}</div>}
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                        <button className="btn-confirm" onClick={handleSubmit}>{editItem ? 'Save' : 'Create'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
