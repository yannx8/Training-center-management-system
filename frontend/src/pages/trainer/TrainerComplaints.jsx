import { useEffect, useState } from 'react';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { trainerApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, SectionHeader, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function TrainerComplaints() {
  const { t } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [modal, setModal]           = useState(null);
  const [response, setResponse]     = useState('');
  const [saving, setSaving]         = useState(false);

  function load() {
    trainerApi.getComplaints()
      .then(r => { setComplaints(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load complaints')));
  }
  useEffect(load, []);

  async function handleRespond() {
    setSaving(true);
    try {
      await trainerApi.respondComplaint(modal.id, { trainerResponse: response, status: 'reviewed' });
      setModal(null); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave','Failed')); }
    finally { setSaving(false); }
  }

  const pending  = complaints.filter(c => c.status === 'pending');
  const reviewed = complaints.filter(c => c.status === 'reviewed');

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const Card = ({ c }) => (
    <div className="card p-4 space-y-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900 text-sm truncate">{c.subject}</p>
            <Badge value={c.status} />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {t('complaints.fromStudent','From {{name}} ({{matricule}}) · {{subject}}', {
              name: c.student?.user?.fullName || 'Unknown',
              matricule: c.student?.matricule || '',
              subject: c.course?.name || c.certification?.name || 'General',
            })}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(c.createdAt).toLocaleString()}</p>
        </div>
        {c.status === 'pending' && (
          <button className="btn-primary btn-sm flex-shrink-0" onClick={() => { setModal(c); setResponse(''); }}>
            {t('common.respond','Respond')}
          </button>
        )}
      </div>
      {c.description && <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{c.description}</p>}
      {c.trainerResponse && (
        <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2">
          <p className="text-xs font-semibold text-green-700 mb-1 flex items-center gap-1"><CheckCircle size={12}/> {t('complaints.yourResponse','Your response')}</p>
          <p className="text-sm text-green-800">{c.trainerResponse}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('complaints.markTitle','Grade Complaints')}
        subtitle={`${pending.length} ${t('complaints.pending','pending')} · ${reviewed.length} ${t('complaints.reviewed','reviewed')}`}
      />

      {complaints.length === 0 && (
        <div className="card p-10 text-center">
          <MessageCircle size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('complaints.noComplaints','No complaints yet.')}</p>
        </div>
      )}

      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">{t('complaints.pending','Pending')}</h2>
          {pending.map(c => <Card key={c.id} c={c}/>)}
        </div>
      )}

      {reviewed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-1">{t('complaints.reviewed','Reviewed')}</h2>
          {reviewed.map(c => <Card key={c.id} c={c}/>)}
        </div>
      )}

      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={t('complaints.respondToMark','Respond to Complaint')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(null)}>{t('common.cancel','Cancel')}</button>
            <button className="btn-primary" onClick={handleRespond} disabled={saving||!response.trim()}>
              {saving ? t('common.saving','Saving…') : t('complaints.sendResponse','Send Response')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {modal && (
            <div className="bg-gray-50 rounded-xl px-3 py-3 text-sm text-gray-700">
              <p className="font-semibold">{modal.subject}</p>
              <p className="text-xs text-gray-400 mt-0.5">{modal.student?.user?.fullName} · {modal.course?.name || modal.certification?.name}</p>
              {modal.description && <p className="mt-2">{modal.description}</p>}
            </div>
          )}
          <div>
            <label className="label">{t('complaints.yourResponse','Your Response')}</label>
            <textarea rows={4} className="input" placeholder={t('complaints.yourResponsePlaceholder','Explain your grading decision…')}
              value={response} onChange={e=>setResponse(e.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
