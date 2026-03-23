// FILE: frontend/src/pages/admin/Certifications.jsx
import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, UserCheck } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, SectionHeader, ConfirmModal, Badge, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY = { name:'', code:'', description:'', durationHours:40, status:'active', capacity:'' };

export default function Certifications() {
  const { t } = useTranslation();
  const [certs, setCerts]       = useState([]);
  const [trainers, setTrainers] = useState([]);  // trainer profiles {id, user:{fullName}}
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selTrainer, setSelTrainer]   = useState('');

  function load() {
    Promise.all([adminApi.getCertifications(), adminApi.getAllTrainers()])
      .then(([c, tr]) => {
        setCerts(c.data || []);
        setTrainers(tr.data || []);
        setLoading(false);
      });
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateCertification(editing.id, form);
      else         await adminApi.createCertification(form);
      setModal(false); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Failed')); }
    finally { setSaving(false); }
  }

  async function handleAssign() {
    // selTrainer is trainers.id (trainer profile id)
    await adminApi.assignTrainerToCert(assignModal.certId, { trainerId: selTrainer || null });
    setAssignModal(null); load();
  }

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('certifications.title', 'Certifications')}
        subtitle={t('certifications.subtitle', 'Standalone certifications')}
      >
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
          <Plus size={16}/> {t('certifications.addCertification', 'Add Certification')}
        </button>
      </SectionHeader>

      {certs.length === 0 && (
        <div className="card p-10 text-center text-gray-400">{t('certifications.noCerts', 'No certifications yet.')}</div>
      )}

      <div className="space-y-2">
        {certs.map(c => {
          const assignedTrainer = c.trainerCourses?.[0]?.trainer;
          return (
            <div key={c.id} className="card px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-400">
                  {c.code} · {c.durationHours}h ·{' '}
                  {c.capacity
                    ? `${c._count?.enrollments || 0}/${c.capacity}`
                    : `${c._count?.enrollments || 0}`}{' '}
                  {t('certifications.enrolments', 'enrolled')}
                </p>
              </div>
              {assignedTrainer
                ? <span className="badge-green text-xs">{assignedTrainer.user?.fullName}</span>
                : <span className="badge-yellow text-xs">{t('certifications.unassigned', 'Unassigned')}</span>
              }
              <Badge value={c.status}/>
              <button
                className="btn-ghost btn-sm btn-icon text-blue-500"
                title={t('certifications.assignTrainer', 'Assign Trainer')}
                onClick={() => {
                  setAssignModal({ certId: c.id });
                  // Use trainer.id (trainers table id), NOT user.id
                  setSelTrainer(String(c.trainerCourses?.[0]?.trainer?.id || ''));
                }}
              >
                <UserCheck size={14}/>
              </button>
              <button
                className="btn-ghost btn-sm btn-icon"
                onClick={() => {
                  setForm({ name: c.name, code: c.code, description: c.description || '', durationHours: c.durationHours, status: c.status, capacity: c.capacity || '' });
                  setEditing(c); setModal(true);
                }}
              >
                <Pencil size={14}/>
              </button>
              <button
                className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50"
                onClick={() => setDeleteId(c.id)}
              >
                <Trash2 size={14}/>
              </button>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      <Modal
        open={modal} onClose={() => setModal(false)}
        title={editing ? t('certifications.editCertification', 'Edit Certification') : t('certifications.addCertification', 'Add Certification')}
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
          <div><label className="label">{t('certifications.certName', 'Name')}</label>
            <input className="input" value={form.name} onChange={e => setForm(p => ({...p, name: e.target.value}))}/>
          </div>
          <div><label className="label">{t('certifications.certCode', 'Code')}</label>
            <input className="input" value={form.code} onChange={e => setForm(p => ({...p, code: e.target.value}))}/>
          </div>
          <div><label className="label">{t('common.description', 'Description')}</label>
            <textarea rows={2} className="input" value={form.description} onChange={e => setForm(p => ({...p, description: e.target.value}))}/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('certifications.durationHours', 'Duration (hours)')}</label>
              <input type="number" min={1} className="input" value={form.durationHours} onChange={e => setForm(p => ({...p, durationHours: +e.target.value}))}/>
            </div>
            <div><label className="label">{t('certifications.maxStudents', 'Max Students')}</label>
              <input type="number" min={1} className="input" placeholder={t('common.noLimit', 'No limit')} value={form.capacity} onChange={e => setForm(p => ({...p, capacity: e.target.value}))}/>
            </div>
          </div>
          <div><label className="label">{t('common.status', 'Status')}</label>
            <select className="select" value={form.status} onChange={e => setForm(p => ({...p, status: e.target.value}))}>
              <option value="active">{t('common.active', 'Active')}</option>
              <option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>
        </div>
      </Modal>

      {/* Assign Trainer Modal */}
      <Modal
        open={!!assignModal} onClose={() => setAssignModal(null)}
        title={t('certifications.assignTrainer', 'Assign Trainer')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignModal(null)}>{t('common.cancel', 'Cancel')}</button>
            <button className="btn-primary" onClick={handleAssign}>{t('common.assign', 'Assign')}</button>
          </>
        }
      >
        <div>
          <label className="label">{t('certifications.trainer', 'Trainer')}</label>
          <select className="select" value={selTrainer} onChange={e => setSelTrainer(e.target.value)}>
            <option value="">{t('programs.removeTrainer', '— Remove trainer —')}</option>
            {trainers.map(tr => (
              <option key={tr.id} value={tr.id}>{tr.user?.fullName}</option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await adminApi.deleteCertification(deleteId); setDeleteId(null); load(); }}
        title={t('certifications.deleteCertification', 'Delete Certification')}
        message={t('certifications.deleteConfirm', 'All enrollments and grades will also be removed.')}
      />
    </div>
  );
}