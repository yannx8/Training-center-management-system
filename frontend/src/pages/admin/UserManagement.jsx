// FILE: /frontend/src/pages/admin/UserManagement.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getUsers, createUser, updateUser, deleteUser } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

const ROLES = ['HOD', 'Trainer', 'Secretary'];
const TABS = ['All Users', 'HOD', 'Trainers', 'Secretaries'];

export default function UserManagement() {
  const { data: users, loading, refetch } = useFetch(getUsers);
  const [activeTab, setActiveTab] = useState('All Users');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', roleName: 'Trainer', department: '', phone: '', status: 'active' });
  const [error, setError] = useState('');

  const filtered = (users || []).filter(u => {
    if (activeTab === 'All Users') return true;
    if (activeTab === 'HOD') return u.roles?.includes('hod');
    if (activeTab === 'Trainers') return u.roles?.includes('trainer');
    if (activeTab === 'Secretaries') return u.roles?.includes('secretary');
    return true;
  });

  function countFor(tab) {
    if (!users) return 0;
    if (tab === 'All Users') return users.length;
    if (tab === 'HOD') return users.filter(u => u.roles?.includes('hod')).length;
    if (tab === 'Trainers') return users.filter(u => u.roles?.includes('trainer')).length;
    if (tab === 'Secretaries') return users.filter(u => u.roles?.includes('secretary')).length;
    return 0;
  }

  function openCreate() {
    setEditUser(null);
    setForm({ fullName: '', email: '', roleName: 'Trainer', department: '', phone: '', status: 'active' });
    setError('');
    setShowModal(true);
  }

  function openEdit(u) {
    setEditUser(u);
    setForm({ fullName: u.full_name, email: u.email, roleName: u.roles?.split(',')[0] || 'Trainer', department: u.department || '', phone: u.phone || '', status: u.status });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit() {
    try {
      if (editUser) {
        await updateUser(editUser.id, { fullName: form.fullName, email: form.email, phone: form.phone, department: form.department, status: form.status });
      } else {
        await createUser({ fullName: form.fullName, email: form.email, roleName: form.roleName.toLowerCase(), department: form.department, phone: form.phone, status: form.status });
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this user?')) return;
    await deleteUser(id);
    refetch();
  }

  const columns = [
    { key: 'full_name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'roles', label: 'Role', render: row => <Badge label={row.roles?.split(',')[0]} type="role" /> },
    { key: 'department', label: 'Department' },
    { key: 'phone', label: 'Phone' },
    { key: 'status', label: 'Status', render: row => <Badge label={row.status} type="status" /> },
    { key: 'actions', label: 'Actions', render: row => (
      <div className="action-btns">
        <button className="btn-icon" onClick={() => openEdit(row)} title="Edit">✏️</button>
        <button className="btn-icon btn-icon-danger" onClick={() => handleDelete(row.id)} title="Delete">🗑️</button>
      </div>
    )},
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">Manage HOD, Trainer, and Secretary accounts</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      <div className="tabs">
        {TABS.map(tab => (
          <button
            key={tab}
            className={`tab${activeTab === tab ? ' active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab} ({countFor(tab)})
          </button>
        ))}
      </div>

      {loading ? <div className="page-loading">Loading...</div> : (
        <div className="table-card">
          <Table
            columns={columns}
            rows={filtered}
            emptyMessage="No users found."
          />
        </div>
      )}

      {showModal && (
        <Modal title={editUser ? 'Edit User' : 'Create New User'} onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label>Full Name *</label>
            <input value={form.fullName} onChange={e => setForm({ ...form, fullName: e.target.value })} placeholder="Enter full name" />
          </div>
          <div className="form-field">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@university.edu" />
          </div>
          {!editUser && (
            <div className="form-field">
              <label>Role *</label>
              <select value={form.roleName} onChange={e => setForm({ ...form, roleName: e.target.value })}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
          <div className="form-field">
            <label>Department</label>
            <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Enter department" />
          </div>
          <div className="form-field">
            <label>Phone Number *</label>
            <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234-567-8900" />
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
            <button className="btn-confirm" onClick={handleSubmit}>{editUser ? 'Save' : 'Create'}</button>
          </div>
        </Modal>
      )}
    </div>
  );
}