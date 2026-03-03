// FILE: /frontend/src/pages/admin/UserManagement.jsx
import { useState } from 'react';
import { useFetch } from '../../hooks/useFetch';
import { getUsers, createUser, updateUser, deleteUser, getDepartments } from '../../api/adminApi';
import Table from '../../components/Table';
import Modal from '../../components/Modal';
import Badge from '../../components/Badge';
import '../../styles/Page.css';

const ROLES = ['All', 'HOD', 'Trainer', 'Secretary'];

export default function UserManagement() {
  const { data: users, loading, refetch } = useFetch(getUsers);
  const { data: departments } = useFetch(getDepartments);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', roleName: 'Trainer', department: '', phone: '', status: 'active' });
  const [error, setError] = useState('');

  // Filter users based on both search term and role filter
  const filtered = (users || []).filter(u => {
    const matchesSearch = !searchTerm || 
      u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'All' || 
      (u.roles && Array.isArray(u.roles) && u.roles.some(role => role.toLowerCase() === roleFilter.toLowerCase()));
    
    return matchesSearch && matchesRole;
  });

  function openCreate() {
    setEditUser(null);
    setForm({ fullName: '', email: '', roleName: 'Trainer', department: '', phone: '', status: 'active' });
    setError('');
    setShowModal(true);
  }

  function openEdit(u) {
    setEditUser(u);
    // Split the roles string into an array
    const userRoles = u.roles ? u.roles.split(',') : [];
    setForm({ 
      fullName: u.full_name, 
      email: u.email, 
      roles: userRoles, // Store roles as an array
      department: u.department || '', 
      phone: u.phone || '', 
      status: u.status 
    });
    setError('');
    setShowModal(true);
  }

  async function handleSubmit() {
    try {
      if (editUser) {
        // Prepare user data for update
        const userData = { 
          fullName: form.fullName, 
          email: form.email, 
          phone: form.phone, 
          department: form.department, 
          status: form.status,
          roles: form.roles // Send roles as an array
        };
        
        await updateUser(editUser.id, userData);
      } else {
        // Only include department if role is Trainer or HOD
        const userData = {
          fullName: form.fullName,
          email: form.email,
          roleName: form.roleName.toLowerCase(),
          phone: form.phone,
          status: form.status
        };
        
        if (['trainer', 'hod'].includes(form.roleName.toLowerCase())) {
          userData.department = form.department;
        }
        
        await createUser(userData);
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
        <button className="btn-primary" onClick={() => openEdit(row)} title="Edit">Edit</button>
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

      <div className="filters">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-select">
          <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>
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
                {ROLES.slice(1).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          )}
          {editUser && (
            <div className="form-field">
              <label>Roles</label>
              <div className="role-checkboxes">
                {ROLES.slice(1).map(role => (
                  <label key={role} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={form.roles.includes(role.toLowerCase())}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm(prev => ({
                            ...prev,
                            roles: [...prev.roles, role.toLowerCase()]
                          }));
                        } else {
                          setForm(prev => ({
                            ...prev,
                            roles: prev.roles.filter(r => r !== role.toLowerCase())
                          }));
                        }
                      }}
                    />
                    {role}
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Show department field only for Trainer and HOD roles */}
          {(!editUser && ['Trainer', 'HOD'].includes(form.roleName)) || 
           (editUser && form.roles.some(role => ['trainer', 'hod'].includes(role))) ? (
            <div className="form-field">
              <label>Department</label>
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}>
                <option value="">Select Department</option>
                {(departments || []).map(dept => (
                  <option key={dept.id} value={dept.name}>{dept.name}</option>
                ))}
              </select>
            </div>
          ) : null}
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