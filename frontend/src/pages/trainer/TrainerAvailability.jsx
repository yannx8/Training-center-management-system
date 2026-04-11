import { useEffect, useState } from 'react';
import { Save, Trash2, Info, Lock, Clock, CheckCircle } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// Official time slots — must match TIME_SLOTS in hodController.js exactly.
// These are the only valid slot starts accepted by the timetable generator.
const TIME_SLOTS = [
  { start: '08:00', end: '10:00' },
  { start: '10:30', end: '12:00' },
  { start: '13:00', end: '15:00' },
  { start: '15:30', end: '17:00' },
  { start: '17:30', end: '19:00' },
  { start: '19:30', end: '21:30' },
];

function slotLabel(slot) {
  return `${slot.start} – ${slot.end}`;
}

function DeadlineCard({ week, isLocked }) {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith('fr') ? 'fr-FR' : 'en-GB';
  const now = new Date();
  const deadline = week.availabilityDeadline ? new Date(week.availabilityDeadline) : null;
  const isOverdue = deadline && deadline < now;

  return (
    <div className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
      isLocked ? 'bg-amber-50 border-amber-200' : isOverdue ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isLocked ? 'bg-amber-100' : isOverdue ? 'bg-red-100' : 'bg-blue-100'
        }`}>
          {isLocked
            ? <Lock size={14} className="text-amber-600" />
            : <Clock size={14} className={isOverdue ? 'text-red-500' : 'text-blue-600'} />
          }
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {week.department?.name || week.departmentName || '—'}
          </p>
          {deadline ? (
            <p className={`text-xs font-medium mt-0.5 ${
              isLocked ? 'text-amber-600' : isOverdue ? 'text-red-500' : 'text-gray-500'
            }`}>
              {isLocked
                ? 'Submissions locked'
                : isOverdue
                  ? `Deadline passed — ${deadline.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                  : `Deadline: ${deadline.toLocaleDateString(locale, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
              }
            </p>
          ) : (
            <p className="text-xs text-gray-400 mt-0.5">
              {isLocked ? 'Submissions locked' : 'No deadline set'}
            </p>
          )}
        </div>
      </div>
      {isLocked && (
        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex-shrink-0 ml-2">
          Locked
        </span>
      )}
    </div>
  );
}

export default function TrainerAvailability() {
  const { t } = useTranslation();
  const [allWeeks, setAllWeeks] = useState([]);
  const [lockMap, setLockMap] = useState({});
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    trainerApi.getPublishedWeeks()
      .then(async r => {
        const weeks = r.data || [];
        setAllWeeks(weeks);
        if (weeks.length === 0) { setLoading(false); return; }

        const lockResults = await Promise.all(
          weeks.map(w =>
            trainerApi.getLockStatus
              ? trainerApi.getLockStatus(w.id).catch(() => ({ data: { isLocked: false } }))
              : Promise.resolve({ data: { isLocked: false } })
          )
        );
        const map = {};
        weeks.forEach((w, i) => { map[w.id] = lockResults[i]?.data?.isLocked || false; });
        setLockMap(map);

        const firstUnlocked = weeks.find(w => !map[w.id]);
        if (firstUnlocked) {
          const avail = await trainerApi.getAvailability({ weekId: firstUnlocked.id }).catch(() => ({ data: [] }));
          // Only load slots whose timeStart matches an official slot — filters out
          // any stale 1-hour rows that might exist in the DB from an older build.
          const officialStarts = new Set(TIME_SLOTS.map(s => s.start));
          setSlots(
            (avail.data || [])
              .filter(a => officialStarts.has(a.timeStart.slice(0, 5)))
              .map(a => ({
                dayOfWeek: a.dayOfWeek,
                timeStart: a.timeStart.slice(0, 5),
                timeEnd:   a.timeEnd.slice(0, 5),
              }))
          );
        }
        setLoading(false);
      })
      .catch(() => { setError(t('common.failedLoad', 'Failed to load')); setLoading(false); });
  }, []);

  const allLocked     = allWeeks.length > 0 && allWeeks.every(w => lockMap[w.id]);
  const unlockedWeeks = allWeeks.filter(w => !lockMap[w.id]);

  function isSelected(day, timeStart) {
    return slots.some(s => s.dayOfWeek === day && s.timeStart === timeStart);
  }

  function toggleSlot(day, slot) {
    if (allLocked) return;
    setMsg('');
    const exists = slots.find(s => s.dayOfWeek === day && s.timeStart === slot.start);
    if (exists) {
      setSlots(p => p.filter(x => !(x.dayOfWeek === day && x.timeStart === slot.start)));
    } else {
      // Store the official start AND end so the backend receives the correct pair
      setSlots(p => [...p, { dayOfWeek: day, timeStart: slot.start, timeEnd: slot.end }]);
    }
  }

  function selectAll() {
    if (allLocked) return;
    const all = [];
    for (const day of DAYS)
      for (const slot of TIME_SLOTS)
        all.push({ dayOfWeek: day, timeStart: slot.start, timeEnd: slot.end });
    setSlots(all);
  }

  async function handleSave() {
    if (unlockedWeeks.length === 0) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await Promise.all(unlockedWeeks.map(w => trainerApi.submitAvailability({ weekId: w.id, slots })));
      setMsg(
        unlockedWeeks.length === 1
          ? t('availability.saved', 'Availability saved successfully!')
          : `Availability saved for ${unlockedWeeks.length} department${unlockedWeeks.length > 1 ? 's' : ''}!`
      );
    } catch (e) {
      setError(e.response?.data?.message || t('common.failedSave', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <PageLoader />;

  const selectedCount = slots.length;
  const daysCovered = DAYS.filter(d => slots.some(s => s.dayOfWeek === d)).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('availability.myAvailabilityTitle', 'My Availability')}</h1>
        <p className="page-subtitle">
          {t('availability.myAvailabilitySubtitle', 'Mark the time slots when you are available to teach')}
        </p>
      </div>

      {allWeeks.length === 0 && !error && (
        <div className="card p-10 text-center">
          <Info size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">
            {t('availability.noPublishedWeeks', 'No published weeks yet')}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {t('availability.noPublishedWeeksHint', 'Your HOD needs to publish an academic week before you can submit availability.')}
          </p>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {allWeeks.length > 0 && (
        <>
          <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
              Active submission periods
            </p>
            {allWeeks.map(w => (
              <DeadlineCard key={w.id} week={w} isLocked={lockMap[w.id] || false} />
            ))}
          </div>

          {unlockedWeeks.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                Your availability will be submitted for{' '}
                <strong>{unlockedWeeks.length} department{unlockedWeeks.length > 1 ? 's' : ''}</strong>{' '}
                simultaneously when you save.
              </span>
            </div>
          )}

          {allLocked && (
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <Lock size={14} className="flex-shrink-0" />
              All submission periods are currently locked by your HOD.
            </div>
          )}

          {!allLocked && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                <Save size={15} />
                {saving ? t('common.saving', 'Saving…') : t('availability.saveAvailability', 'Save Availability')}
              </button>
              <button className="btn-secondary" onClick={selectAll}>
                {t('availability.selectAll', 'Select All')}
              </button>
              <button className="btn-secondary" onClick={() => { setSlots([]); setMsg(''); }}>
                <Trash2 size={15} /> {t('availability.clearAll', 'Clear')}
              </button>
            </div>
          )}

          {msg && (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">
              <CheckCircle size={15} className="flex-shrink-0" /> {msg}
            </div>
          )}

          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-start gap-2 text-xs text-blue-700">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              <span>
                {allLocked
                  ? 'All availability periods are locked — no editing allowed.'
                  : t('availability.instructionGrid', 'Click a cell to toggle availability. Blue = available.')}
              </span>
            </div>

            <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">{selectedCount}</span>{' '}
                {t('availability.slotsSelected', 'slot(s) selected')}
              </p>
              {selectedCount > 0 && (
                <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                  {daysCovered} {daysCovered === 1 ? t('availability.dayCovered', 'day') : t('availability.daysCovered', 'days')}
                </span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse" style={{ minWidth: '520px' }}>
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-36 sticky left-0 bg-gray-50 z-10">
                      {t('time.timeSlot', 'Time')}
                    </th>
                    {DAYS.map(d => (
                      <th key={d} className="px-1 py-2.5 text-center text-xs font-semibold text-gray-600 min-w-[72px]">
                        {t(`days.${d}`, d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.map((slot, ri) => (
                    <tr key={slot.start} className={`border-b border-gray-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10">
                        <span className="text-xs font-mono font-semibold text-gray-700 whitespace-nowrap">
                          {slotLabel(slot)}
                        </span>
                      </td>
                      {DAYS.map(day => {
                        const sel = isSelected(day, slot.start);
                        return (
                          <td key={day} className="px-1 py-1 text-center">
                            <button
                              onClick={() => toggleSlot(day, slot)}
                              disabled={allLocked}
                              className={`w-full h-8 rounded-lg text-xs font-semibold transition-all border
                                ${allLocked
                                  ? sel
                                    ? 'bg-blue-200 text-blue-700 border-blue-300 cursor-not-allowed'
                                    : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                                  : sel
                                    ? 'bg-blue-500 text-white border-blue-600 shadow-sm hover:bg-blue-600'
                                    : 'bg-white text-gray-300 border-gray-200 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-300'
                                }`}
                            >
                              {sel ? '✓' : ''}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-blue-500 inline-block" />
                {t('availability.available', 'Available')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block" />
                {t('availability.notAvailable', 'Not available')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}