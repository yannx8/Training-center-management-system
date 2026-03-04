import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getUsers, createUser, updateUser, deleteUser, getDepartments } from '../../api/adminApi';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';
import '../../styles/UserManagement.css';

const ROLES = ['hod', 'trainer', 'secretary'];

export default function UserManagement() {
  const { data: users, loading, refetch } = useFetch(getUsers);
  const { data: departments } = useFetch(getDepartments);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', roleName: 'trainer', department: '', phone: '', status: 'active' });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = (users || []).filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.full_name||'').toLowerCase().includes(q) || (u.email||'').toLowerCase().includes(q);
    const matchRole = !roleFilter || (u.roles||'').toLowerCase().split(',').map(r=>r.trim()).includes(roleFilter);
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchRole && matchStatus;
  });

  function openCreate() {
    setEditUser(null);
    setForm({ fullName: '', email: '', roleName: 'trainer', department: '', phone: '', status: 'active' });
    setError('');
    setShowModal(true);
  }

  function openEdit(u) {
    setEditUser(u);
    setForm({
      fullName: u.full_name,
      email: u.email,
      roles: (u.roles || '').split(',').map(r => r.trim()).filter(Boolean),
      department: u.department || '',
      phone: u.phone || '',
      status: u.status,
    });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      if (editUser) {
        await updateUser(editUser.id, {
          fullName: form.fullName, email: form.email,
          phone: form.phone, department: form.department,
          status: form.status, roles: form.roles,
        });
      } else {
        const payload = { fullName: form.fullName, email: form.email, roleName: form.roleName, phone: form.phone, status: form.status };
        if (['trainer', 'hod'].includes(form.roleName)) payload.department = form.department;
        await createUser(payload);
      }
      setShowModal(false);
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id, name) {
    if (!confirm(`Delete "${name}"?`)) return;
    try { await deleteUser(id); refetch(); }
    catch (err) { alert(err.response?.data?.message || 'Delete failed'); }
  }

  const needsDept = (roles) => (roles || []).some(r => ['trainer','hod'].includes(r));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">User Management</h1>
          <p className="page-subtitle">HOD, Trainer and Secretary accounts</p>
        </div>
        <button className="btn-primary" onClick={openCreate}>+ Add User</button>
      </div>

      {/* Toolbar */}
      <div className="um-toolbar">
        <input
          className="um-search"
          type="text"
          placeholder="Search name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select className="um-select" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
          <option value="">All Roles</option>
          {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
        </select>
        <select className="um-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {(search || roleFilter || statusFilter) && (
          <button className="um-clear" onClick={() => { setSearch(''); setRoleFilter(''); setStatusFilter(''); }}>Clear</button>
        )}
        <span className="um-count">{loading ? '...' : `${filtered.length} user(s)`}</span>
      </div>

      {/* Table */}
      <div className="table-card">
        {loading ? (
          <p className="um-msg">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="um-msg">No users found.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id}>
                  <td>{u.full_name}</td>
                  <td>{u.email}</td>
                  <td>{u.department || '—'}</td>
                  <td>{u.phone || '—'}</td>
                  <td><Badge label={u.status} /></td>
                  <td>
                    <button className="um-btn-edit" onClick={() => openEdit(u)}>Edit</button>
                    <button className="um-btn-del" onClick={() => handleDelete(u.id, u.full_name)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <Modal title={editUser ? 'Edit User' : 'Add User'} onClose={() => setShowModal(false)}>
          <div className="form-field">
            <label>Full Name *</label>
            <input value={form.fullName} onChange={e => setForm({...form, fullName: e.target.value})} placeholder="Full name" />
          </div>
          <div className="form-field">
            <label>Email *</label>
            <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="email@example.com" />
          </div>
          <div className="form-field">
            <label>Phone *</label>
            <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+237 6XX XXX XXX" />
          </div>

          {!editUser && (
            <div className="form-field">
              <label>Role *</label>
              <select value={form.roleName} onChange={e => setForm({...form, roleName: e.target.value})}>
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
              </select>
            </div>
          )}

          {editUser && (
            <div className="form-field">
              <label>Roles</label>
              <div className="um-checks">
                {ROLES.map(r => (
                  <label key={r} className="um-check">
                    <input
                      type="checkbox"
                      checked={(form.roles||[]).includes(r)}
                      onChange={e => setForm(prev => ({
                        ...prev,
                        roles: e.target.checked ? [...(prev.roles||[]), r] : (prev.roles||[]).filter(x=>x!==r)
                      }))}
                    />
                    {r.charAt(0).toUpperCase()+r.slice(1)}
                  </label>
                ))}
              </div>
            </div>
          )}

          {((!editUser && ['trainer','hod'].includes(form.roleName)) ||
            (editUser && needsDept(form.roles))) && (
            <div className="form-field">
              <label>Department</label>
              <select value={form.department} onChange={e => setForm({...form, department: e.target.value})}>
                <option value="">Select Department</option>
                {(departments||[]).map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
            </div>
          )}

          <div className="form-field">
            <label>Status</label>
            <select value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {!editUser && <p className="um-hint">Default password = phone number.</p>}
          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button className="btn-cancel" onClick={() => setShowModal(false)} disabled={saving}>Cancel</button>
            <button className="btn-confirm" onClick={handleSubmit} disabled={saving}>
              {saving ? 'Saving...' : editUser ? 'Save' : 'Create'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}