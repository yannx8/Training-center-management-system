import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, SectionHeader, ConfirmModal, Badge, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY_DEPT = { name: '', code: '', hodUserId: '', status: 'active' };

export function Departments() {
  const { t } = useTranslation();
  const [depts, setDepts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_DEPT);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    Promise.all([adminApi.getDepartments(), adminApi.getUsers()])
      .then(([d, u]) => {
        setDepts(d.data || []);
        setUsers((u.data || []).filter(x => x.roles?.includes('hod') || x.roles?.includes('trainer')));
        setLoading(false);
      });
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateDepartment(editing.id, form);
      else await adminApi.createDepartment(form);
      setModal(false); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Failed')); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('departments.title', 'Departments')}
        subtitle={t('departments.subtitle', '{{count}} departments', { count: depts.length })}
      >
        <button className="btn-primary" onClick={() => { setForm(EMPTY_DEPT); setEditing(null); setModal(true); }}>
          <Plus size={16} /> {t('departments.addDepartment', 'Add Department')}
        </button>
      </SectionHeader>

      {depts.length === 0 && <div className="card p-10 text-center text-gray-400">{t('departments.noDepts', 'No departments yet.')}</div>}

      <div className="space-y-2">
        {depts.map(d => (
          <div key={d.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900">{d.name}</p>
              <p className="text-xs text-gray-400">{d.code} · {t('departments.hod', 'HOD')}: {d.hod?.fullName || d.hodName || t('departments.noHod', '—')}</p>
            </div>
            <Badge value={d.status} />
            <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: d.name, code: d.code, hodUserId: d.hodUserId || '', status: d.status }); setEditing(d); setModal(true); }}><Pencil size={14} /></button>
            <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(d.id)}><Trash2 size={14} /></button>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? t('departments.editDepartment', 'Edit Department') : t('departments.addDepartment', 'Add Department')}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel', 'Cancel')}</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}</button></>}>
        <div className="space-y-4">
          <div><label className="label">{t('common.name', 'Name')}</label><input className="input" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
          <div><label className="label">{t('common.code', 'Code')}</label><input className="input" value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))} /></div>
          <div><label className="label">{t('departments.hodOptional', 'HOD (optional)')}</label>
            <select className="select" value={form.hodUserId} onChange={e => setForm(p => ({ ...p, hodUserId: e.target.value }))}>
              <option value="">{t('departments.noHod', '— No HOD —')}</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          <div><label className="label">{t('common.status', 'Status')}</label>
            <select className="select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
              <option value="active">{t('common.active', 'Active')}</option><option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await adminApi.deleteDepartment(deleteId); setDeleteId(null); load(); }}
        title={t('departments.deleteDepartment', 'Delete Department')} message={t('departments.deleteConfirm', 'All programs in this department will be unlinked.')} />
    </div>
  );
}
export default Departments;