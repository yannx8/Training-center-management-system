import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, Edit3 } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function AdminComplaints() {
  const { t, i18n } = useTranslation();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [tab, setTab]         = useState('all');
  const [modal, setModal]     = useState(null);
  const [response, setResponse] = useState('');
  const [status, setStatus]   = useState('in_progress');
  const [saving, setSaving]   = useState(false);
  const locale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-GB';

  function load() {
    adminApi.getComplaints()
      .then(r => { setComplaints(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load complaints')));
  }
  useEffect(load, []);

  async function handleRespond() {
    setSaving(true);
    try {
      await adminApi.updateComplaint(modal.id, { status, adminResponse: response });
      setModal(null); load();
    } catch { alert(t('common.failedSave','Failed to save response')); }
    finally { setSaving(false); }
  }

  const pending    = complaints.filter(c => c.status === 'pending');
  const inProgress = complaints.filter(c => c.status === 'in_progress');
  const resolved   = complaints.filter(c => c.status === 'resolved');

  const TABS = [
    { key: 'all',         label: t('complaints.all','All'),               count: complaints.length },
    { key: 'pending',     label: t('complaints.pending','Pending'),        count: pending.length },
    { key: 'in_progress', label: t('complaints.inProgress','In Progress'), count: inProgress.length },
    { key: 'resolved',    label: t('complaints.resolved','Resolved'),      count: resolved.length },
  ];

  const filtered = tab === 'all' ? complaints : complaints.filter(c => c.status === tab);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const StatusIcon = ({ s }) => {
    if (s === 'pending')     return <AlertTriangle size={14} className="text-amber-500"/>;
    if (s === 'in_progress') return <Clock size={14} className="text-blue-500"/>;
    if (s === 'resolved')    return <CheckCircle size={14} className="text-green-500"/>;
    return null;
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('complaints.parentComplaintsTitle','Parent Complaints')}</h1>
        <p className="page-subtitle">{t('complaints.parentComplaintsSubtitle','View and respond to parent complaints and concerns')}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-3 text-center border-l-4 border-l-amber-400">
          <p className="text-xl font-bold text-gray-900">{pending.length}</p>
          <p className="text-xs text-amber-600 font-medium mt-0.5">{t('complaints.pending','Pending')}</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-l-blue-400">
          <p className="text-xl font-bold text-gray-900">{inProgress.length}</p>
          <p className="text-xs text-blue-600 font-medium mt-0.5">{t('complaints.inProgress','In Progress')}</p>
        </div>
        <div className="card p-3 text-center border-l-4 border-l-green-400">
          <p className="text-xl font-bold text-gray-900">{resolved.length}</p>
          <p className="text-xs text-green-600 font-medium mt-0.5">{t('complaints.resolved','Resolved')}</p>
        </div>
      </div>

      {/* Tab pills */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(tb => (
          <button
            key={tb.key}
            onClick={() => setTab(tb.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
              tab === tb.key ? 'bg-gray-900 text-white border-gray-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {tb.label} ({tb.count})
          </button>
        ))}
      </div>

      {/* Complaint cards */}
      {filtered.length === 0 && (
        <div className="card p-10 text-center text-gray-400">{t('complaints.noComplaints','No complaints yet.')}</div>
      )}

      <div className="space-y-3">
        {filtered.map(c => (
          <div key={c.id} className="card p-4 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <StatusIcon s={c.status}/>
                  <p className="font-semibold text-sm text-gray-900">{c.subject}</p>
                  <Badge value={c.priority} label={t(`complaints.${c.priority}`, c.priority)}/>
                </div>
                <p className="text-xs text-gray-500">
                  <span className="font-medium">{c.parent?.user?.fullName || t('complaints.parentName','Parent')}</span>
                  {' · '}{new Date(c.createdAt).toLocaleDateString(locale)}
                </p>
              </div>
              <button
                className="btn-primary btn-sm flex-shrink-0"
                onClick={() => { setModal(c); setResponse(c.adminResponse||''); setStatus(c.status); }}
              >
                <Edit3 size={13}/> {t('common.respond','Respond')}
              </button>
            </div>
            {c.description && (
              <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{c.description}</p>
            )}
            {c.adminResponse && (
              <div className="bg-violet-50 border border-violet-100 rounded-xl px-3 py-2">
                <p className="text-xs font-semibold text-violet-700 mb-1">{t('complaints.adminResponse','Administration response')}</p>
                <p className="text-sm text-violet-800">{c.adminResponse}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Respond modal */}
      <Modal
        open={!!modal}
        onClose={() => setModal(null)}
        title={t('complaints.respondTo','Respond to Complaint')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(null)}>{t('common.cancel','Cancel')}</button>
            <button className="btn-primary" onClick={handleRespond} disabled={saving}>
              {saving ? t('common.saving','Saving…') : t('complaints.saveResponse','Save Response')}
            </button>
          </>
        }
      >
        {modal && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-1">
              <p className="font-semibold text-sm text-gray-800">{modal.subject}</p>
              <p className="text-xs text-gray-500">{t('complaints.from','From')}: {modal.parent?.user?.fullName}</p>
              {modal.description && <p className="text-sm text-gray-600 pt-1">{modal.description}</p>}
            </div>
            <div>
              <label className="label">{t('complaints.updateStatus','Update Status')}</label>
              <select className="select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="pending">{t('complaints.pending','Pending')}</option>
                <option value="in_progress">{t('complaints.inProgress','In Progress')}</option>
                <option value="resolved">{t('complaints.resolved','Resolved')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('complaints.response','Response Message')}</label>
              <textarea
                rows={4}
                className="input"
                placeholder={t('complaints.responsePlaceholder','Write your response…')}
                value={response}
                onChange={e => setResponse(e.target.value)}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}