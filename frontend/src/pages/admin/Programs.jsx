import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import {
    getPrograms, createProgram, updateProgram, deleteProgram,
    getDepartments, getCourses,
} from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

export default function Programs() {
    const { data, loading, refetch } = useFetch(getPrograms);
    const { data: departments } = useFetch(getDepartments);

    // Program CRUD state 
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState({ name: '', code: '', departmentId: '', durationYears: 1, status: 'active' });
    const [error, setError] = useState('');

    // ── Course viewer state ───────────────────────────────────────────────────
    const [currentProgram, setCurrentProgram] = useState(null);
    const [courses, setCourses] = useState([]);
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [coursesError, setCoursesError] = useState('');

    // Load courses whenever currentProgram changes
    useEffect(() => {
        if (!currentProgram) { setCourses([]); return; }
        setCoursesLoading(true);
        setCoursesError('');
        getCourses(currentProgram.id)
            .then(res => setCourses(res.data.data || []))
            .catch(() => setCoursesError('Failed to load courses'))
            .finally(() => setCoursesLoading(false));
    }, [currentProgram]);

    // ── Program form helpers ──────────────────────────────────────────────────
    function openCreate() {
        setEditItem(null);
        setForm({ name: '', code: '', departmentId: '', durationYears: 1, status: 'active' });
        setError('');
        setShowModal(true);
    }
    function openEdit(p) {
        setEditItem(p);
        setForm({ name: p.name, code: p.code, departmentId: p.department_id || '', durationYears: p.duration_years, status: p.status });
        setError('');
        setShowModal(true);
    }

    async function handleSubmit() {
        try {
            if (editItem) await updateProgram(editItem.id, form);
            else await createProgram(form);
            setShowModal(false);
            refetch();
            // If we were viewing this program's courses, refresh them
            if (editItem && currentProgram?.id === editItem.id) {
                setCurrentProgram(prev => ({ ...prev, ...form }));
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete program? This cannot be undone.')) return;
        await deleteProgram(id);
        refetch();
        if (currentProgram?.id === id) setCurrentProgram(null);
    }

    // ── Table columns ─────────────────────────────────────────────────────────
    const programColumns = [
        { key: 'name', label: 'Program Name' },
        { key: 'code', label: 'Code' },
        { key: 'department_name', label: 'Department' },
        { key: 'duration_years', label: 'Duration', render: r => `${r.duration_years} yr${r.duration_years !== 1 ? 's' : ''}` },
        { key: 'status', label: 'Status', render: r => <Badge label={r.status} /> },
        {
            key: 'actions', label: 'Actions', render: r => (
                <div className="action-btns">
                    <button
                        className="btn-primary"
                        style={{
                            background: currentProgram?.id === r.id ? '#1a1a2e' : undefined,
                            color: currentProgram?.id === r.id ? '#fff' : undefined,
                        }}
                        onClick={() => setCurrentProgram(currentProgram?.id === r.id ? null : r)}
                    >
                        {currentProgram?.id === r.id ? 'Hide Courses' : 'View Courses'}
                    </button>
                    <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
            ),
        },
    ];

    // Group courses by level/semester for display
    const coursesByLevel = (() => {
        const groups = {};
        (courses || []).forEach(c => {
            const key = `${c.level_name || 'General'} — ${c.semester_name || ''}`.trim().replace(/—\s*$/, '');
            if (!groups[key]) groups[key] = [];
            groups[key].push(c);
        });
        return groups;
    })();

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Programs</h1>
                    <p className="page-subtitle">Manage academic programs</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Add Program</button>
            </div>

            {loading ? (
                <div className="page-loading">Loading…</div>
            ) : (
                <div className="table-card">
                    <Table columns={programColumns} rows={data || []} emptyMessage="No programs found." />
                </div>
            )}

            {/* ── Courses panel ── */}
            {currentProgram && (
                <div className="page-section" style={{ marginTop: '1.5rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '1rem',
                    }}>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#1a1a2e' }}>
                                Courses — {currentProgram.name}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', marginTop: 4 }}>
                                {currentProgram.code} · {currentProgram.duration_years} year{currentProgram.duration_years !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            style={{ background: 'none', border: 'none', fontSize: '1.25rem', cursor: 'pointer', color: '#64748b' }}
                            onClick={() => setCurrentProgram(null)}
                            title="Close"
                        >✕</button>
                    </div>

                    {coursesLoading && <div className="page-loading">Loading courses…</div>}
                    {coursesError && <div style={{ color: '#dc2626', padding: '0.5rem' }}>{coursesError}</div>}

                    {!coursesLoading && !coursesError && courses.length === 0 && (
                        <div className="table-card">
                            <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📚</div>
                                <div style={{ fontWeight: 600 }}>No courses found for this program</div>
                                <div style={{ fontSize: '0.82rem', marginTop: 6 }}>
                                    Courses are created via sessions. Make sure academic years and sessions are set up first.
                                </div>
                            </div>
                        </div>
                    )}

                    {!coursesLoading && courses.length > 0 && (
                        Object.entries(coursesByLevel).map(([levelLabel, levelCourses]) => (
                            <div key={levelLabel} className="table-card" style={{ marginBottom: '1rem' }}>
                                <div style={{
                                    fontWeight: 700, fontSize: '0.82rem', color: '#3b5be8',
                                    textTransform: 'uppercase', letterSpacing: '0.04em',
                                    marginBottom: '0.75rem', paddingBottom: '0.5rem',
                                    borderBottom: '1px solid #e5e7eb',
                                }}>
                                    {levelLabel}
                                </div>
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Course Name</th>
                                            <th>Code</th>
                                            <th>Credits</th>
                                            <th>Hours/Week</th>
                                            <th>Trainer(s)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {levelCourses.map(c => (
                                            <tr key={c.id}>
                                                <td style={{ fontWeight: 600 }}>{c.name}</td>
                                                <td style={{ color: '#64748b', fontSize: '0.85rem' }}>{c.code}</td>
                                                <td style={{ textAlign: 'center' }}>{c.credits}</td>
                                                <td style={{ textAlign: 'center' }}>{c.hours_per_week}h</td>
                                                <td style={{ color: c.trainer_name ? '#1a1a2e' : '#94a3b8', fontSize: '0.85rem' }}>
                                                    {c.trainer_name || '—'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Create/Edit Program Modal ── */}
            {showModal && (
                <Modal title={editItem ? 'Edit Program' : 'Create New Program'} onClose={() => setShowModal(false)}>
                    <div className="form-field">
                        <label>Program Name *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g., Bachelor of Computer Science" />
                    </div>
                    <div className="form-field">
                        <label>Code *</label>
                        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g., BSC-CS" />
                    </div>
                    <div className="form-field">
                        <label>Department *</label>
                        <select value={form.departmentId} onChange={e => setForm({ ...form, departmentId: e.target.value })}>
                            <option value="">Select Department</option>
                            {(departments || []).map(dept => (
                                <option key={dept.id} value={dept.id}>{dept.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-field">
                        <label>Duration (years)</label>
                        <input type="number" min="1" value={form.durationYears} onChange={e => setForm({ ...form, durationYears: e.target.value })} />
                    </div>
                    <div className="form-field">
                        <label>Status</label>
                        <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>
                    {error && <div className="form-error">{error}</div>}
                    <div className="modal-actions">
                        <button className="btn-cancel" onClick={() => setShowModal(false)}>Cancel</button>
                        <button className="btn-confirm" onClick={handleSubmit}>{editItem ? 'Save Changes' : 'Create'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}