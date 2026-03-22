import { useEffect, useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function HodAvailability() {
  const { t } = useTranslation();
  const [weeks, setWeeks]       = useState([]);
  const [weekId, setWeekId]     = useState('');
  const [status, setStatus]     = useState(null); // { trainers, weekId }
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [error, setError]       = useState('');

  useEffect(() => {
    hodApi.getWeeks()
      .then(r => { setWeeks(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }, []);

  useEffect(() => {
    if (!weekId) { setStatus(null); setIsLocked(false); return; }
    setLoadingStatus(true);
    Promise.all([
      hodApi.getTrainerAvailabilityStatus(weekId),
      hodApi.getLockStatus(weekId),
    ]).then(([s, l]) => {
      setStatus(s.data);
      setIsLocked(l.data?.isLocked || false);
      setLoadingStatus(false);
    }).catch(() => { setLoadingStatus(false); });
  }, [weekId]);

  async function toggleLock() {
    try {
      if (isLocked) { await hodApi.unlockAvailability({ weekId }); setIsLocked(false); }
      else          { await hodApi.lockAvailability({ weekId });   setIsLocked(true); }
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave','Failed')); }
  }

  const publishedWeeks = weeks.filter(w => w.status === 'published');
  const submitted    = status?.trainers?.filter(tr => tr.submitted) || [];
  const notSubmitted = status?.trainers?.filter(tr => !tr.submitted) || [];
  const allDone      = status?.trainers?.length > 0 && notSubmitted.length === 0;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('availability.title','Trainer Availability')}</h1>
        <p className="page-subtitle">{t('availability.subtitle','Monitor who has submitted availability for each published week')}</p>
      </div>
      {error && <ErrorAlert message={error} />}

      {/* Week select + lock */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <label className="label">{t('availability.selectWeek','Select Week')}</label>
            <select className="select" value={weekId} onChange={e => setWeekId(e.target.value)}>
              <option value="">{t('availability.choosePublishedWeek','— Choose a published week —')}</option>
              {publishedWeeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
          {weekId && (
            <button className={isLocked ? 'btn-secondary' : 'btn-primary'} onClick={toggleLock}>
              {isLocked ? <><Unlock size={15}/> {t('availability.unlock','Unlock')}</> : <><Lock size={15}/> {t('availability.lockSubmissions','Lock Submissions')}</>}
            </button>
          )}
        </div>

        {isLocked && weekId && (
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
            {t('availability.locked','🔒 Locked — trainers cannot edit')}
          </p>
        )}

        {!weekId && (
          <p className="text-sm text-gray-400">{t('availability.selectWeekFirst','Select a published week to see availability status.')}</p>
        )}
        {weekId && publishedWeeks.length === 0 && (
          <p className="text-sm text-gray-400">{t('availability.noPublishedWeeks','No published weeks yet.')}</p>
        )}
      </div>

      {/* Status */}
      {weekId && loadingStatus && <PageLoader />}

      {weekId && !loadingStatus && status && (
        <>
          {allDone && (
            <div className="card p-4 bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2">
              <CheckCircle size={16}/> {t('availability.allSubmitted','All trainers have submitted! ✓')}
            </div>
          )}

          {/* Submitted */}
          {submitted.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-green-50 border-b border-green-100 flex items-center gap-2">
                <CheckCircle size={15} className="text-green-600"/>
                <h3 className="font-semibold text-green-800 text-sm">{t('availability.submitted','Submitted')} ({submitted.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {submitted.map(tr => {
                  const key = `s-${tr.id}`;
                  return (
                    <div key={tr.id}>
                      <button
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        onClick={() => setExpanded(e => ({ ...e, [key]: !e[key] }))}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700 text-xs font-bold">
                            {tr.user?.fullName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{tr.user?.fullName}</p>
                            <p className="text-xs text-green-600">{t('availability.slots','{{count}} slot(s)', { count: tr.slotCount })}</p>
                          </div>
                        </div>
                        {expanded[key] ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                      </button>
                      {expanded[key] && tr.slots?.length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1">
                          {tr.slots.map((s,i) => (
                            <span key={i} className="text-xs bg-green-50 border border-green-200 text-green-700 rounded-lg px-2 py-1">
                              {s.dayOfWeek} {s.timeStart?.slice(0,5)}–{s.timeEnd?.slice(0,5)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Not submitted */}
          {notSubmitted.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <XCircle size={15} className="text-red-500"/>
                <h3 className="font-semibold text-red-700 text-sm">{t('availability.notSubmitted','Not Submitted')} ({notSubmitted.length})</h3>
              </div>
              <div className="divide-y divide-gray-50">
                {notSubmitted.map(tr => (
                  <div key={tr.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0 text-red-400 text-xs font-bold">
                      {tr.user?.fullName?.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-sm text-gray-700">{tr.user?.fullName}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
