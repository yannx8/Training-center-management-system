import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, Filter } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import Table from '../../components/ui/Table';
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from '../../components/ui';

// Admin can only assign these three roles (admin is assigned at DB level)
const ASSIGNABLE_ROLES = ['hod', 'trainer', 'secretary'];
const ALL_ROLES        = ['admin', 'hod', 'trainer', 'secretary', 'student', 'parent'];
const EMPTY = { fullName: '', email: '', phone: '', roleName: 'trainer', department: '', status: 'active' };

export default function UserManagement() {
  const [users, setUsers]         = useState([]);
  const [depts, setDepts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [hodWarning, setHodWarning] = useState('');

  function load() {
    setLoading(true);
    Promise.all([adminApi.getUsers(roleFilter ? { role: roleFilter } : {}), adminApi.getDepartments()])
      .then(([u, d]) => { setUsers(u.data); setDepts(d.data); setLoading(false); })
      .catch(() => setError('Failed to load'));
  }
  useEffect(load, [roleFilter]);

  // When role = hod and department is chosen, check if another HOD already exists for that dept
  useEffect(() => {
    if (form.roleName !== 'hod' || !form.department) { setHodWarning(''); return; }
    const deptObj = depts.find(d => d.name === form.department);
    if (!deptObj || !deptObj.hodUserId) { setHodWarning(''); return; }
    if (editing && deptObj.hodUserId === editing.id) { setHodWarning(''); return; }
    setHodWarning(`⚠ This department already has an HOD (${deptObj.hodName}). Saving will replace them.`);
  }, [form.roleName, form.department]);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateUser(editing.id, { ...form, roles: [form.roleName] });
      else         await adminApi.createUser(form);
      setModal(false); load();
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  function openEdit(u) {
    setForm({ fullName: u.fullName, email: u.email, phone: u.phone || '', roleName: u.roles?.[0] || 'trainer', department: u.department || '', status: u.status });
    setEditing(u); setModal(true);
  }

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const cols = [
    { key: 'name',   label: 'Name',   render: u => <span className="font-medium">{u.fullName}</span> },
    { key: 'email',  label: 'Email',  render: u => <span className="text-gray-500">{u.email}</span> },
    { key: 'phone',  label: 'Phone',  render: u => u.phone || '—' },
    { key: 'status', label: 'Status', render: u => <Badge value={u.status}/> },
    { key: 'actions',label: '',       render: u => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}><Pencil size={13}/></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(u.id)}><Trash2 size={13}/></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader/>;

  return (
    <div className="space-y-4">
      <SectionHeader title="User Management" subtitle={`${filtered.length} of ${users.length} users`}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
          <Plus size={16}/> Add User
        </button>
      </SectionHeader>
      {error && <ErrorAlert message={error}/>}

      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9 text-sm" placeholder="Search name or email…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-gray-400"/>
          <select className="select text-sm w-36" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">All Roles</option>
            {ALL_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select text-sm w-32" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Table columns={cols} data={filtered} emptyMsg="No users found."/>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? 'Edit User' : 'New User'}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div className="space-y-4">
          {[['Full Name', 'fullName', 'text'], ['Email', 'email', 'email'], ['Phone', 'phone', 'tel']].map(([l, k, t]) => (
            <div key={k}>
              <label className="label">{l}</label>
              <input type={t} className="input" value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}/>
            </div>
          ))}
          <div>
            <label className="label">Role</label>
            <select className="select" value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))}>
              {ASSIGNABLE_ROLES.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Only HOD, trainer, and secretary roles can be assigned here.</p>
          </div>
          {(form.roleName === 'hod' || form.roleName === 'trainer') && (
            <div>
              <label className="label">Department</label>
              <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">— None —</option>
                {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              {hodWarning && <p className="text-xs text-amber-600 mt-1">{hodWarning}</p>}
            </div>
          )}
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await adminApi.deleteUser(deleteId); setDeleteId(null); load(); }}
        title="Delete User" message="This cannot be undone."/>
    </div>
  );
}
