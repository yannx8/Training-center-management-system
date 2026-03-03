// FILE: /frontend/src/pages/admin/Programs.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getPrograms, createProgram, updateProgram, deleteProgram } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

export default function Programs() {
  const { data, loading, refetch } = useFetch(getPrograms);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', departmentId: '', durationYears: 3, status: 'active' });
  const [error, setError] = useState('');

  function openCreate() { setEditItem(null); setForm({ name: '', code: '', departmentId: '', durationYears: 3, status: 'active' }); setError(''); setShowModal(true); }
  function openEdit(p) { setEditItem(p); setForm({ name: p.name, code: p.code, departmentId: p.department_id || '', durationYears: p.duration_years, status: p.status }); setError(''); setShowModal(true); }

  async function handleSubmit() {
    try {
      if (editItem) await updateProgram(editItem.id, form);
      else await createProgram(form);
      setShowModal(false); refetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete program?')) return;
    await deleteProgram(id); refetch();
  }

  const columns = [
    { key: 'name', label: 'Program Name' },
    { key: 'code', label: 'Code' },
    { key: 'department_name', label: 'Department' },
    { key: 'duration_years', label: 'Duration', render: r => `${r.duration_years} years` },
    { key: 'status', label: 'Status', render: r => <Badge label={r.status} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="action-btns">
        <button className="btn-icon" onClick={() => openEdit(r)}>✏️</button>
        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(r.id)}>🗑️</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Programs</h1><p className="page-subtitle">Manage academic programs and courses</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Program</button>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card"><Table columns={columns} rows={data || []} emptyMessage="No programs found." /></div>
      )}
      {showModal && (
        <Modal title={editItem ? 'Edit Program' : 'Create New Program'} onClose={() => setShowModal(false)}>
          <div className="form-field"><label>Program Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Bachelor of Computer Science" /></div>
          <div className="form-field"><label>Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g., BCS" /></div>
          <div className="form-field"><label>Duration (years)</label><input type="number" value={form.durationYears} onChange={e => setForm({...form, durationYears: e.target.value})} /></div>
          <div className="form-field"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
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