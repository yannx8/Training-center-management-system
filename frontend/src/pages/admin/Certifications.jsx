// FILE: /frontend/src/pages/admin/Certifications.jsx
import { useState, useEffect } from 'react';
import { getCertifications, createCertification, updateCertification, deleteCertification } from '../../api/adminApi';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import Table from '../../components/Table';
import '../../styles/Page.css';

const empty = { name: '', code: '', description: '', durationHours: 40, status: 'active' };

export default function Certifications() {
    const [certs, setCerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editItem, setEditItem] = useState(null);
    const [form, setForm] = useState(empty);
    const [error, setError] = useState('');

    const load = () => {
        setLoading(true);
        getCertifications()
            .then(res => setCerts(res.data.data || []))
            .catch(() => {})
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    function openCreate() { setEditItem(null); setForm(empty); setError(''); setShowModal(true); }
    function openEdit(c) {
        setEditItem(c);
        setForm({ name: c.name, code: c.code, description: c.description || '', durationHours: c.duration_hours, status: c.status });
        setError('');
        setShowModal(true);
    }

    async function handleSubmit() {
        if (!form.name || !form.code) { setError('Name and code are required.'); return; }
        try {
            if (editItem) await updateCertification(editItem.id, form);
            else await createCertification(form);
            setShowModal(false);
            load();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to save.');
        }
    }

    async function handleDelete(id) {
        if (!confirm('Delete this certification? This will also remove related enrollments and grades.')) return;
        try {
            await deleteCertification(id);
            load();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete.');
        }
    }

    const columns = [
        { key: 'name', label: 'Certification Name' },
        { key: 'code', label: 'Code' },
        { key: 'duration_hours', label: 'Duration', render: r => `${r.duration_hours}h` },
        { key: 'trainer_count', label: 'Trainers', render: r => r.trainer_count || 0 },
        { key: 'student_count', label: 'Enrolled', render: r => r.student_count || 0 },
        { key: 'status', label: 'Status', render: r => <Badge label={r.status} /> },
        {
            key: 'actions', label: 'Actions', render: r => (
                <div className="action-btns">
                    <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleDelete(r.id)}>Delete</button>
                </div>
            )
        },
    ];

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Certifications</h1>
                    <p className="page-subtitle">Manage standalone certification programs</p>
                </div>
                <button className="btn-primary" onClick={openCreate}>+ Add Certification</button>
            </div>

            {loading ? (
                <div className="page-loading">Loading…</div>
            ) : (
                <div className="table-card">
                    <Table columns={columns} rows={certs} emptyMessage="No certifications found." />
                </div>
            )}

            {showModal && (
                <Modal title={editItem ? 'Edit Certification' : 'New Certification'} onClose={() => setShowModal(false)}>
                    <div className="form-field">
                        <label>Name *</label>
                        <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. AWS Cloud Practitioner" />
                    </div>
                    <div className="form-field">
                        <label>Code *</label>
                        <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. AWS-CP-01" />
                    </div>
                    <div className="form-field">
                        <label>Description</label>
                        <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Optional description…" />
                    </div>
                    <div className="form-field">
                        <label>Duration (hours)</label>
                        <input type="number" min={1} value={form.durationHours} onChange={e => setForm({ ...form, durationHours: e.target.value })} />
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
                        <button className="btn-confirm" onClick={handleSubmit}>{editItem ? 'Save' : 'Create'}</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}
