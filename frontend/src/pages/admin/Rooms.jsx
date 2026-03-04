import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getRooms, createRoom, updateRoom, deleteRoom } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

const ROOM_TYPES = ['Classroom', 'Lab', 'Lecture Hall', 'Auditorium'];

export default function Rooms() {
  const { data, loading, refetch } = useFetch(getRooms);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', building: '', capacity: 30, roomType: 'Classroom', status: 'available' });
  const [error, setError] = useState('');

  function openCreate() { setEditItem(null); setForm({ name: '', code: '', building: '', capacity: 30, roomType: 'Classroom', status: 'available' }); setError(''); setShowModal(true); }
  function openEdit(r) { setEditItem(r); setForm({ name: r.name, code: r.code, building: r.building, capacity: r.capacity, roomType: r.room_type, status: r.status }); setError(''); setShowModal(true); }

  async function handleSubmit() {
    try {
      if (editItem) await updateRoom(editItem.id, form);
      else await createRoom(form);
      setShowModal(false); refetch();
    } catch (err) { setError(err.response?.data?.message || 'Failed'); }
  }

  async function handleDelete(id) {
    if (!confirm('Delete room?')) return;
    await deleteRoom(id); refetch();
  }

  const columns = [
    { key: 'name', label: 'Room Name' },
    { key: 'code', label: 'Code' },
    { key: 'building', label: 'Building' },
    { key: 'capacity', label: 'Capacity' },
    { key: 'room_type', label: 'Type', render: r => <Badge label={r.room_type} type="role" /> },
    { key: 'status', label: 'Status', render: r => <Badge label={r.status} /> },
    { key: 'actions', label: 'Actions', render: r => (
      <div className="action-btns">
                    <button className="um-btn-edit" onClick={() => openEdit(r)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleDelete(r.id)}>Delete</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div><h1 className="page-title">Rooms</h1><p className="page-subtitle">Manage classrooms, labs, and lecture halls</p></div>
        <button className="btn-primary" onClick={openCreate}>+ Add Room</button>
      </div>
      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card"><Table columns={columns} rows={data || []} emptyMessage="No rooms found." /></div>
      )}
      {showModal && (
        <Modal title={editItem ? 'Edit Room' : 'Add Room'} onClose={() => setShowModal(false)}>
          <div className="form-field"><label>Room Name *</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} placeholder="e.g., Room 101" /></div>
          <div className="form-field"><label>Code *</label><input value={form.code} onChange={e => setForm({...form, code: e.target.value})} placeholder="e.g., A-101" /></div>
          <div className="form-field"><label>Building</label><input value={form.building} onChange={e => setForm({...form, building: e.target.value})} placeholder="e.g., Building A" /></div>
          <div className="form-field"><label>Capacity</label><input type="number" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} /></div>
          <div className="form-field"><label>Type</label>
            <select value={form.roomType} onChange={e => setForm({...form, roomType: e.target.value})}>
              {ROOM_TYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-field"><label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
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