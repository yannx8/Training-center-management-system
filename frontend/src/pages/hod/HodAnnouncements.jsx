import { useEffect, useState } from 'react';
import { Plus, Megaphone, Trash2 } from 'lucide-react';
import { hodApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY = { title: '', body: '', targetRole: 'all' };

export default function HodAnnouncements() {
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [modal, setModal]     = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const locale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-GB';

  function load() {
    hodApi.getAnnouncements()
      .then(r => { setAnnouncements(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }
  useEffect(load, []);

  async function handleSave() {
    if (!form.title.trim() || !form.body.trim()) return;
    setSaving(true);
    try { await hodApi.createAnnouncement(form); setModal(false); setForm(EMPTY); load(); }
    catch (e) { alert(e.response?.data?.message || t('common.failedSave','Failed')); }
    finally { setSaving(false); }
  }

  const TARGET_OPTIONS = [
    { value: 'all',     label: t('announcements.targetEveryone','Everyone') },
    { value: 'trainer', label: t('announcements.targetTrainers','Trainers only') },
    { value: 'student', label: t('announcements.targetStudents','Students only') },
    { value: 'parent',  label: t('announcements.targetParents','Parents only') },
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title={t('announcements.title','Announcements')} subtitle={t('announcements.subtitle','Publish messages to your department stakeholders')}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setModal(true); }}>
          <Plus size={16}/> {t('announcements.newAnnouncement','New Announcement')}
        </button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      {announcements.length === 0 && (
        <div className="card p-10 text-center">
          <Megaphone size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">{t('announcements.noAnnouncementsYet','No announcements yet.')}</p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Megaphone size={16} className="text-teal-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                  <span className="badge-blue capitalize">{TARGET_OPTIONS.find(o=>o.value===a.targetRole)?.label || a.targetRole}</span>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{a.body}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {t('announcements.by','By {{name}}', { name: a.creator?.fullName })} · {new Date(a.createdAt).toLocaleDateString(locale, { day:'numeric', month:'short', year:'numeric' })}
                </p>
              </div>
              <button className="btn-ghost btn-sm btn-icon text-red-400 hover:bg-red-50 flex-shrink-0" onClick={() => setDeleteId(a.id)}>
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={t('announcements.createAnnouncement','Create Announcement')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>{t('common.cancel','Cancel')}</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving||!form.title||!form.body}>
              {saving ? t('common.saving','Saving…') : t('common.publish','Publish')}
            </button>
          </>
        }>
        <div className="space-y-4">
          <div><label className="label">{t('announcements.messageTitle','Title')}</label><input className="input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
          <div><label className="label">{t('announcements.message','Message')}</label><textarea rows={4} className="input" value={form.body} onChange={e=>setForm(f=>({...f,body:e.target.value}))}/></div>
          <div>
            <label className="label">{t('announcements.targetAudience','Target Audience')}</label>
            <select className="select" value={form.targetRole} onChange={e=>setForm(f=>({...f,targetRole:e.target.value}))}>
              {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async () => { await hodApi.deleteAnnouncement(deleteId); setDeleteId(null); load(); }}
        title={t('announcements.title','Announcement')}
        message={t('announcements.deleteConfirm','Remove this announcement?')} />
    </div>
  );
}
