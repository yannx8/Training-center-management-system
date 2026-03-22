// ─── HodWeeks.jsx ────────────────────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { Plus, Send, Unlock, Trash2 } from 'lucide-react';
import { hodApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, SectionHeader, ConfirmModal, Badge, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY = { weekNumber:1, label:'', startDate:'', endDate:'', academicYearId:'' };

export default function HodWeeks() {
  const { t } = useTranslation();
  const [weeks, setWeeks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    hodApi.getWeeks()
      .then(r => { setWeeks(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try { await hodApi.createWeek(form); setModal(false); load(); }
    catch (e) { alert(e.response?.data?.message || t('common.failedSave','Failed')); }
    finally { setSaving(false); }
  }

  async function publish(id)   { try { await hodApi.publishWeek(id);   load(); } catch(e) { alert(e.response?.data?.message||t('common.failedSave','Failed')); } }
  async function unpublish(id) { try { await hodApi.unpublishWeek(id); load(); } catch(e) { alert(e.response?.data?.message||t('common.failedSave','Failed')); } }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title={t('weeks.title','Academic Weeks')} subtitle={t('weeks.subtitle','Create weeks and publish them so trainers can submit availability')}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16}/> {t('weeks.createWeek','Create Week')}
        </button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      <div className="card p-3 bg-blue-50 border border-blue-200 text-xs text-blue-700 rounded-xl">
        {t('weeks.workflow','Workflow: Create week → Publish → Trainers submit availability → Generate timetable → Publish timetable')}
      </div>

      {/* Mobile-friendly week cards */}
      {weeks.length === 0 && (
        <div className="card p-10 text-center text-gray-400">{t('weeks.noWeeksYet','No academic weeks created yet.')}</div>
      )}

      <div className="space-y-2">
        {weeks.map(w => (
          <div key={w.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-sm text-gray-900">{w.label}</p>
                <Badge value={w.status} />
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                {t('weeks.weekNumber','Week')} {w.weekNumber} · {new Date(w.startDate).toLocaleDateString()} – {new Date(w.endDate).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {w.status === 'draft' ? (
                <button className="btn-primary btn-sm" onClick={() => publish(w.id)} title={t('weeks.publishWeek','Publish')}>
                  <Send size={13}/> {t('weeks.publishWeek','Publish')}
                </button>
              ) : (
                <button className="btn-secondary btn-sm" onClick={() => unpublish(w.id)} title={t('weeks.unpublishWeek','Unpublish')}>
                  <Unlock size={13}/>
                </button>
              )}
              <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(w.id)}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={t('weeks.createWeek','Create Academic Week')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel','Cancel')}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('weeks.creating','Creating…') : t('common.create','Create')}</button>
          </>
        }>
        <div className="space-y-4">
          <div><label className="label">{t('weeks.weekNumber','Week Number')}</label><input type="number" min={1} className="input" value={form.weekNumber} onChange={e=>setForm(p=>({...p,weekNumber:+e.target.value}))}/></div>
          <div><label className="label">{t('weeks.label','Label')}</label><input className="input" placeholder={t('weeks.labelPlaceholder','e.g. Week 1 — Sept 2025')} value={form.label} onChange={e=>setForm(p=>({...p,label:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('weeks.startDate','Start Date')}</label><input type="date" className="input" value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}/></div>
            <div><label className="label">{t('weeks.endDate','End Date')}</label><input type="date" className="input" value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}/></div>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await hodApi.deleteWeek(deleteId); setDeleteId(null); load(); }}
        title={t('weeks.deleteWeek','Delete Week')} message={t('weeks.deleteConfirm','All availability and timetable data for this week will be removed.')} />
    </div>
  );
}
