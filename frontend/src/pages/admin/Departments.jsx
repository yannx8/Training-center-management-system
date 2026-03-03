// FILE: /frontend/src/pages/admin/Departments.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getDepartments, createDepartment, updateDepartment, deleteDepartment } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

export default function Departments() {
  const { data: departments, loading, refetch } = useFetch(getDepartments);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', hodName: '', status: 'active' });
  const [error, setError] = useState('');

  function openCreate() { setEditItem(null); setForm({ name: '', code: '', hodName: '', status: 'active' }); setError(''); setShowModal(true); }
  function openEdit(d) { setEditItem(d); setForm({ name: d.name, code: d.code, hodName: d.hod_name || '', status: d.status }); setError(''); setShowModal(true); }

  async function handleSubmit() {
    try {
      if (editItem) await updateDepartment(editItem.id, form);
      else await createDepartment(form);
      setShowModal(false); refetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete department?')) return;
    await deleteDepartment(id); refetch();
  }

  const columns = [
    { key: 'name', label: 'Department Name' },
    { key: 'code', label: 'Code' },
    { key: 'hod_name', label: 'HOD' },
    { key: 'student_count', label: 'Students' },
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
        <div><h1 className="page-title">Departments</h1><p className="page-subtitle">Manage academic departments</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Department</button>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card"><Table columns={columns} rows={departments || []} emptyMessage="No departments found." /></div>
      )}
      {showModal && (
        <Modal title={editItem ? 'Edit Department' : 'Create New Department'} onClose={() => setShowModal(false)}>
          <div className="form-field"><label>Department Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Computer Science" /></div>
          <div className="form-field"><label>Department Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g., CS" /></div>
          <div className="form-field"><label>Head of Department *</label><input value={form.hodName} onChange={e => setForm({...form, hodName: e.target.value})} placeholder="Enter HOD name" /></div>
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