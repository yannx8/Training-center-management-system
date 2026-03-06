import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getAcademicYears, createAcademicYear, updateAcademicYear } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

export default function AcademicYears() {
  const { data, loading, refetch } = useFetch(getAcademicYears);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', startDate: '', endDate: '', isActive: false });
  const [error, setError] = useState('');

  function openCreate() { setEditItem(null); setForm({ name: '', startDate: '', endDate: '', isActive: false }); setError(''); setShowModal(true); }
  function openEdit(y) { setEditItem(y); setForm({ name: y.name, startDate: y.start_date?.split('T')[0], endDate: y.end_date?.split('T')[0], isActive: y.is_active }); setError(''); setShowModal(true); }

  async function handleSubmit() {
    try {
      if (editItem) await updateAcademicYear(editItem.id, form);
      else await createAcademicYear(form);
      setShowModal(false); refetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  const columns = [
    { key: 'name', label: 'Academic Year' },
    { key: 'start_date', label: 'Start Date', render: r => r.start_date?.split('T')[0] },
    { key: 'end_date', label: 'End Date', render: r => r.end_date?.split('T')[0] },
    { key: 'is_active', label: 'Status', render: r => <Badge label={r.is_active ? 'active' : 'inactive'} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="action-btns">
        <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Academic Years</h1><p className="page-subtitle">Manage academic calendar years</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Academic Year</button>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card"><Table columns={columns} rows={data || []} emptyMessage="No academic years found." /></div>
      )}
      {showModal && (
        <Modal title={editItem ? 'Edit Academic Year' : 'Add Academic Year'} onClose={() => setShowModal(false)}>
          <div className="form-field"><label>Year Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., 2025-2026" /></div>
          <div className="form-field"><label>Start Date *</label><input type="date" value={form.startDate} onChange={e => setForm({...form, startDate: e.target.value})} /></div>
          <div className="form-field"><label>End Date *</label><input type="date" value={form.endDate} onChange={e => setForm({...form, endDate: e.target.value})} /></div>
          <div className="form-field checkbox-field">
            <label><input type="checkbox" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} /> Mark as Active</label>
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