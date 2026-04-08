import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Search, UserCheck, UserX } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const ASSIGNABLE_ROLES = ['hod', 'trainer', 'secretary'];
const EMPTY = { firstName: '', lastName: '', email: '', phone: '', roleName: 'trainer', department: '', status: 'active' };

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [depts, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [hodWarning, setHodWarning] = useState('');

  // This little effect handles auto-generating the email address as the admin types.
  // It only runs when creating a new user, making sure it doesn't overwrite an existing email.
  useEffect(() => {
    if (!editing && form.firstName && form.lastName) {
      const email = `${form.firstName.toLowerCase().trim()}.${form.lastName.toLowerCase().trim()}`.replace(/\s+/g, '') + '@pylvia.com';
      setForm(f => ({ ...f, email }));
    } else if (!editing && (!form.firstName || !form.lastName)) {
      setForm(f => ({ ...f, email: '' }));
    }
  }, [form.firstName, form.lastName, editing]);

  // Grabs both the user list and the department list so we have them ready.
  function load() {
    setLoading(true);
    Promise.all([adminApi.getUsers(roleFilter ? { role: roleFilter } : {}), adminApi.getDepartments()])
      .then(([u, d]) => { setUsers(u.data || []); setDepts(d.data || []); setLoading(false); })
      .catch(() => setError(t('common.failedLoad', 'Failed to load')));
  }
  useEffect(load, [roleFilter]);

  // This is a safety check: since each department should only have one HOD, 
  // we warn the admin if they're about to assign a new HOD to a department that already has one.
  useEffect(() => {
    if (form.roleName !== 'hod' || !form.department) { setHodWarning(''); return; }
    const dept = depts.find(d => d.name === form.department);
    if (!dept?.hodUserId) { setHodWarning(''); return; }
    if (editing && dept.hodUserId === editing.id) { setHodWarning(''); return; }
    setHodWarning(t('userManagement.hodWarning', '⚠ This department already has a HOD ({{name}}). Saving will replace them.', { name: dept.hodName }));
  }, [form.roleName, form.department]);

  // Handles both creating new users and updating existing ones.
  async function handleSave() {
    setSaving(true);
    try {
      const payload = { ...form, roles: [form.roleName] };
      if (editing) {
        // We combine the names back together for the backend update.
        await adminApi.updateUser(editing.id, { ...payload, fullName: `${form.firstName} ${form.lastName}` });
      } else {
        await adminApi.createUser(payload);
      }
      setModal(false); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Save failed')); }
    finally { setSaving(false); }
  }

  function openEdit(u) {
    const parts = u.fullName.split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';
    setForm({ firstName, lastName, email: u.email, phone: u.phone || '', roleName: u.roles?.[0] || 'trainer', department: u.department || '', status: u.status });
    setEditing(u); setModal(true);
  }

  async function toggleStatus(u) {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    try { await adminApi.updateUser(u.id, { status: newStatus }); load(); }
    catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Failed')); }
  }

  const filtered = users.filter(u => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || u.status === statusFilter;
    return matchSearch && matchStatus;
  });

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('userManagement.title', 'User Management')}
        subtitle={t('userManagement.subtitle', '{{filtered}} of {{total}} users', { filtered: filtered.length, total: users.length })}
      >
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
          <Plus size={16} /> {t('userManagement.addUser', 'Add User')}
        </button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      <div className="card p-3 space-y-2">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="input pl-9"
            placeholder={t('userManagement.searchPlaceholder', 'Search by name or email…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select className="select flex-1 text-sm" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="">{t('userManagement.allRoles', 'All Roles')}</option>
            {['admin', 'hod', 'trainer', 'secretary', 'student', 'parent'].map(r => (
              <option key={r} value={r}>{t(`roles.${r}`, r)}</option>
            ))}
          </select>
          <select className="select flex-1 text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">{t('userManagement.allStatus', 'All Status')}</option>
            <option value="active">{t('common.active', 'Active')}</option>
            <option value="inactive">{t('common.inactive', 'Inactive')}</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="card p-10 text-center text-gray-400">{t('common.noData', 'No data available.')}</div>
      )}

      <div className="space-y-2">
        {filtered.map(u => (
          <div key={u.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{u.fullName}</p>
              <p className="text-xs text-gray-400 truncate">{u.email}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Badge value={u.status} />
              <button
                className="btn-ghost btn-sm btn-icon"
                title={u.status === 'active' ? t('userManagement.deactivate', 'Deactivate') : t('userManagement.activate', 'Activate')}
                onClick={() => toggleStatus(u)}
              >
                {u.status === 'active'
                  ? <UserX size={14} className="text-amber-500" />
                  : <UserCheck size={14} className="text-green-500" />}
              </button>
              <button className="btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}>
                <Pencil size={14} />
              </button>
              <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(u.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={modal} onClose={() => setModal(false)}
        title={editing ? t('userManagement.editUser', 'Edit User') : t('userManagement.addUser', 'Add User')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel', 'Cancel')}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('common.firstName', 'First Name')}</label>
              <input className="input" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            </div>
            <div>
              <label className="label">{t('common.lastName', 'Last Name')}</label>
              <input className="input" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">{t('common.email', 'Email')}</label>
            <input type="email" className="input bg-gray-50 gray-400 cursor-not-allowed" value={form.email} readOnly disabled />
            <p className="text-[10px] text-gray-400 mt-1">{t('userManagement.emailAuto', 'Email is auto-generated and cannot be edited.')}</p>
          </div>
          <div>
            <label className="label">{t('common.phone', 'Phone')}</label>
            <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            {!editing && <p className="text-xs text-gray-400 mt-1">{t('userManagement.phoneNote', 'Phone number becomes the initial password.')}</p>}
          </div>
          <div>
            <label className="label">{t('userManagement.role', 'Role')}</label>
            <select className="select" value={form.roleName} onChange={e => setForm(f => ({ ...f, roleName: e.target.value }))}>
              {ASSIGNABLE_ROLES.map(r => <option key={r} value={r}>{t(`roles.${r}`, r)}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">{t('userManagement.roleNote', 'Only HOD, Trainer and Secretary roles can be assigned here.')}</p>
          </div>
          {(form.roleName === 'hod' || form.roleName === 'trainer') && (
            <div>
              <label className="label">{t('userManagement.department', 'Department')}</label>
              <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                <option value="">{t('userManagement.noneOption', '— None —')}</option>
                {depts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
              </select>
              {hodWarning && <p className="text-xs text-amber-600 mt-1">{hodWarning}</p>}
            </div>
          )}
          <div>
            <label className="label">{t('common.status', 'Status')}</label>
            <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">{t('common.active', 'Active')}</option>
              <option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await adminApi.deleteUser(deleteId); setDeleteId(null); load(); }}
        title={t('userManagement.deleteUser', 'Delete User')}
        message={t('userManagement.deleteConfirm', 'This action cannot be undone.')}
      />
    </div>
  );
}