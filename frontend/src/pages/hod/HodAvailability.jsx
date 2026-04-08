import { useEffect, useState } from 'react';
import { Lock, Unlock, ChevronDown, ChevronUp, CheckCircle, XCircle } from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function HodAvailability() {
  const { t } = useTranslation();
  const [weeks, setWeeks] = useState([]);
  const [weekId, setWeekId] = useState('');
  const [status, setStatus] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    hodApi.getWeeks()
      .then(r => {
        const published = (r.data || []).filter(w => w.status === 'published');
        setWeeks(published);
        if (published.length > 0) {

          const latest = [...published].sort((a, b) => b.weekNumber - a.weekNumber)[0];
          setWeekId(latest.id);
        }
        setLoading(false);
      })
      .catch(() => setError(t('common.failedLoad', 'Failed to load')));
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
      else { await hodApi.lockAvailability({ weekId }); setIsLocked(true); }
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Failed')); }
  }

  const notSubmitted = status?.trainers?.filter(tr => !tr.submitted) || [];
  const allDone = status?.trainers?.length > 0 && notSubmitted.length === 0;

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">{t('availability.title', 'Trainer Availability')}</h1>
          <p className="page-subtitle">{t('availability.subtitle', 'Monitor who has submitted availability for the active week')}</p>
        </div>
        {weekId && (
          <button className={isLocked ? 'btn-secondary' : 'btn-primary'} onClick={toggleLock}>
            {isLocked ? <><Unlock size={15} /> {t('availability.unlock', 'Unlock')}</> : <><Lock size={15} /> {t('availability.lockSubmissions', 'Lock Submissions')}</>}
          </button>
        )}
      </div>

      {error && <ErrorAlert message={error} />}

      {isLocked && weekId && (
        <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          {t('availability.locked', ' Locked — trainers cannot edit')}
        </p>
      )}

      {/* Generation status */}
      {weekId && loadingStatus && <PageLoader />}

      {weekId && !loadingStatus && status && (
        <>
          {allDone ? (
            <div className="card p-10 text-center space-y-3">
              <CheckCircle size={40} className="text-green-500 mx-auto" />
              <p className="font-semibold text-gray-900">{t('availability.allSubmitted', 'All trainers have submitted!')}</p>
              <p className="text-sm text-gray-400">The timetable for this week can now be convenientl</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="px-5 py-4 bg-red-50 border-b border-red-100 flex items-center gap-2">
                <XCircle size={17} className="text-red-500" />
                <h3 className="font-semibold text-red-700">{t('availability.notSubmitted', 'Trainers who haven\'t submitted yet')} ({notSubmitted.length})</h3>
              </div>
              <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                {notSubmitted.map(tr => (
                  <div key={tr.id} className="px-5 py-4 flex items-center justify-between group hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-sm">
                        {tr.user?.fullName?.charAt(0).toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{tr.user?.fullName || "Unknown Trainer"}</p>
                        <p className="text-xs text-gray-400 truncate">{tr.user?.email}</p>
                      </div>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-red-400 bg-red-50 px-2 py-1 rounded-lg">Pending</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!weekId && !loading && (
        <div className="card p-10 text-center text-gray-400">
          No published academic week found.
        </div>
      )}
    </div>
  );
}
