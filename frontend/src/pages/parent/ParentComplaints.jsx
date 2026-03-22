// ─── ParentComplaints.jsx ──────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { MessageSquare, Plus } from 'lucide-react';
import { parentApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, SectionHeader, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY = { subject: '', description: '', priority: 'medium', studentId: '' };

export function ParentComplaints() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [children, setChildren]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [modal, setModal]           = useState(false);
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  function load() {
    Promise.all([parentApi.getComplaints(), parentApi.getChildren()])
      .then(([c, ch]) => { setComplaints(c.data||[]); setChildren(ch.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }
  useEffect(load, []);

  async function handleSubmit() {
    if (!form.subject.trim()) return;
    setSaving(true);
    try {
      await parentApi.createComplaint({
        subject:     form.subject,
        description: form.description,
        priority:    form.priority,
        studentId:   form.studentId || undefined,
      });
      setModal(false); setForm(EMPTY); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave','Failed')); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const pending  = complaints.filter(c => c.status === 'pending');
  const resolved = complaints.filter(c => c.status !== 'pending');

  return (
    <div className="space-y-4">
      <SectionHeader title={t('complaints.title','Complaints')} subtitle={t('complaints.subtitle','Submit and track your complaints')}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16}/> {t('complaints.newComplaint','New Complaint')}
        </button>
      </SectionHeader>

      {complaints.length === 0 && (
        <div className="card p-10 text-center">
          <MessageSquare size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('complaints.noPendingComplaints','No complaints submitted yet.')}</p>
        </div>
      )}

      {[{ label: t('complaints.pending','Pending'), items: pending }, { label: t('complaints.resolved','Resolved'), items: resolved }]
        .filter(g => g.items.length > 0)
        .map(group => (
          <div key={group.label}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">{group.label}</h2>
            <div className="space-y-3">
              {group.items.map(c => (
                <div key={c.id} className="card p-4 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-gray-900">{c.subject}</p>
                        <Badge value={c.status} />
                        <Badge value={c.priority} label={t(`complaints.${c.priority}`, c.priority)} />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{new Date(c.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  {c.description && <p className="text-sm text-gray-600">{c.description}</p>}
                  {c.adminResponse && (
                    <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                      <p className="text-xs font-semibold text-violet-700 mb-1">{t('complaints.adminResponse','Administration response')}</p>
                      <p className="text-sm text-violet-800">{c.adminResponse}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

      <Modal open={modal} onClose={() => setModal(false)} title={t('complaints.submitComplaint','Submit Complaint')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel','Cancel')}</button>
            <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
              {saving ? t('common.submitting','Submitting…') : t('common.submit','Submit')}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div>
            <label className="label">{t('complaints.subjectLabel','Subject *')}</label>
            <input className="input" placeholder={t('complaints.subjectPlaceholder','Brief title')}
              value={form.subject} onChange={e => setForm(f=>({...f,subject:e.target.value}))} />
          </div>
          <div>
            <label className="label">{t('complaints.details','Details')}</label>
            <textarea rows={3} className="input" placeholder={t('complaints.detailsPlaceholder','Describe your concern…')}
              value={form.description} onChange={e => setForm(f=>({...f,description:e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('complaints.priority','Priority')}</label>
              <select className="select" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                <option value="high">{t('complaints.high','High')}</option>
                <option value="medium">{t('complaints.medium','Medium')}</option>
                <option value="low">{t('complaints.low','Low')}</option>
              </select>
            </div>
            {children.length > 0 && (
              <div>
                <label className="label">{t('complaints.regardingChild','Regarding Child')}</label>
                <select className="select" value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))}>
                  <option value="">{t('complaints.generalComplaint','— General —')}</option>
                  {children.map(c => <option key={c.id} value={c.id}>{c.user?.fullName}</option>)}
                </select>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default ParentComplaints;
