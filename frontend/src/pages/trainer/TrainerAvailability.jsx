import { useEffect, useState } from 'react';
import { Save, Trash2, Info } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

// Always use English keys for storage/comparison; translate only for display
const DAYS_EN = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

function slotLabel(time) {
  const idx  = TIME_SLOTS.indexOf(time);
  const next = TIME_SLOTS[idx + 1] || '19:00';
  return `${time} – ${next}`;
}

export default function TrainerAvailability() {
  const { t } = useTranslation();
  const [weeks, setWeeks]       = useState([]);
  const [weekId, setWeekId]     = useState('');
  const [weekInfo, setWeekInfo] = useState(null);
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');
  const [msg, setMsg]           = useState('');
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    trainerApi.getPublishedWeeks()
      .then(r => { setWeeks(r.data||[]); setLoading(false); })
      .catch(() => { setError(t('availability.noPublishedWeeks','No published weeks available.')); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!weekId) { setSlots([]); setWeekInfo(null); setIsLocked(false); return; }
    setWeekInfo(weeks.find(w => String(w.id) === String(weekId)) || null);
    trainerApi.getAvailability({ weekId }).then(r => {
      setSlots((r.data||[]).map(a => ({
        dayOfWeek: a.dayOfWeek,
        timeStart: a.timeStart.slice(0,5),
        timeEnd:   a.timeEnd.slice(0,5),
      })));
    }).catch(() => {});
    trainerApi.getLockStatus?.({ weekId })
      .then(r => setIsLocked(r?.data?.isLocked || false))
      .catch(() => setIsLocked(false));
  }, [weekId]);

  function isSelected(day, time) {
    return slots.some(s => s.dayOfWeek === day && s.timeStart === time);
  }

  function toggleSlot(day, time) {
    if (isLocked) return;
    setMsg('');
    const exists = slots.find(s => s.dayOfWeek === day && s.timeStart === time);
    if (exists) {
      setSlots(p => p.filter(x => !(x.dayOfWeek === day && x.timeStart === time)));
    } else {
      const idx = TIME_SLOTS.indexOf(time);
      const end = TIME_SLOTS[idx + 1] || '19:00';
      setSlots(p => [...p, { dayOfWeek: day, timeStart: time, timeEnd: end }]);
    }
  }

  function selectAll() {
    if (isLocked) return;
    const all = [];
    for (const day of DAYS_EN) {
      for (let i = 0; i < TIME_SLOTS.length - 1; i++) {
        all.push({ dayOfWeek: day, timeStart: TIME_SLOTS[i], timeEnd: TIME_SLOTS[i+1] });
      }
    }
    setSlots(all);
  }

  async function handleSave() {
    if (!weekId || isLocked) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await trainerApi.submitAvailability({ weekId, slots });
      setMsg(t('availability.saved','Availability saved successfully!'));
    } catch (e) {
      setError(e.response?.data?.message || t('common.failedSave','Failed to save'));
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;

  const selectedCount = slots.length;
  const daysCovered   = DAYS_EN.filter(d => slots.some(s => s.dayOfWeek === d)).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('availability.myAvailabilityTitle','My Availability')}</h1>
        <p className="page-subtitle">{t('availability.myAvailabilitySubtitle','Select the time slots when you are available to teach')}</p>
      </div>

      {weeks.length === 0 && !error && (
        <div className="card p-8 text-center text-gray-400">
          <p className="font-medium">{t('availability.noPublishedWeeks','No published weeks available yet.')}</p>
          <p className="text-sm mt-1">{t('availability.noPublishedWeeksHint','Your HOD needs to publish an academic week before you can submit availability.')}</p>
        </div>
      )}
      {error && <ErrorAlert message={error} />}

      {weeks.length > 0 && (
        <>
          {/* Controls card */}
          <div className="card p-4 space-y-3">
            <div>
              <label className="label">{t('availability.selectWeek','Select Week')}</label>
              <select className="select" value={weekId} onChange={e => { setWeekId(e.target.value); setMsg(''); setError(''); }}>
                <option value="">{t('availability.choosePublishedWeek','— Choose a published week —')}</option>
                {weeks.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.label}{w.department?.name ? ` (${w.department.name})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {weekInfo && (
              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                {weekInfo.label}
                {weekInfo.startDate && ` · ${new Date(weekInfo.startDate).toLocaleDateString()} – ${new Date(weekInfo.endDate).toLocaleDateString()}`}
              </p>
            )}

            {isLocked && weekId && (
              <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                <Info size={15}/> {t('availability.locked','🔒 Locked — trainers cannot edit')}
              </div>
            )}

            {weekId && !isLocked && (
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                  <Save size={15}/> {saving ? t('common.saving','Saving…') : t('availability.saveAvailability','Save Availability')}
                </button>
                <button className="btn-secondary" onClick={selectAll}>
                  {t('availability.selectAll','Select All')}
                </button>
                <button className="btn-secondary" onClick={() => setSlots([])}>
                  <Trash2 size={15}/> {t('availability.clearAll','Clear All')}
                </button>
              </div>
            )}
          </div>

          {msg && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">✓ {msg}</div>
          )}

          {/* Availability grid */}
          {weekId && (
            <div className="card overflow-hidden">
              {/* Instructions */}
              <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-start gap-2 text-xs text-blue-700">
                <Info size={13} className="flex-shrink-0 mt-0.5"/>
                <span>
                  {t('availability.instructionGrid','Click any cell to toggle availability. Blue = available.')}
                  {isLocked && <strong className="ml-1 text-amber-700"> {t('availability.lockedNote','Locked by HOD.')}</strong>}
                </span>
              </div>

              {/* Counter */}
              <div className="px-4 py-2 border-b border-gray-100 flex items-center justify-between">
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-gray-900">{selectedCount}</span>{' '}
                  {t('availability.slotsSelected','slot(s) selected.', { count: selectedCount })}
                </p>
                {selectedCount > 0 && (
                  <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full font-medium">
                    {daysCovered} {daysCovered === 1 ? t('availability.dayCovered','day') : t('availability.daysCovered','days')}
                  </span>
                )}
              </div>

              {/* Scrollable grid */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse" style={{ minWidth: '520px' }}>
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-28 sticky left-0 bg-gray-50 z-10">
                        {t('time.timeSlot','Time')}
                      </th>
                      {DAYS_EN.map(d => (
                        <th key={d} className="px-1 py-2.5 text-center text-xs font-semibold text-gray-600 min-w-[72px]">
                          {t(`days.${d}`, d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TIME_SLOTS.slice(0,-1).map((time, ri) => (
                      <tr key={time} className={`border-b border-gray-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                        <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10">
                          <span className="text-xs font-mono font-semibold text-gray-700 whitespace-nowrap">{slotLabel(time)}</span>
                        </td>
                        {DAYS_EN.map(day => {
                          const sel = isSelected(day, time);
                          return (
                            <td key={day} className="px-1 py-1 text-center">
                              <button
                                onClick={() => toggleSlot(day, time)}
                                disabled={isLocked}
                                title={sel
                                  ? `${t('availability.available','Available')} — ${t(`days.${day}`,day)} ${time}`
                                  : `${t(`days.${day}`,day)} ${time}`}
                                className={`
                                  w-full h-8 rounded-lg text-xs font-semibold transition-all border
                                  ${isLocked
                                    ? sel ? 'bg-blue-200 text-blue-700 border-blue-300 cursor-not-allowed'
                                           : 'bg-gray-100 text-gray-300 border-gray-200 cursor-not-allowed'
                                    : sel ? 'bg-blue-500 text-white border-blue-600 shadow-sm hover:bg-blue-600'
                                           : 'bg-white text-gray-300 border-gray-200 hover:bg-blue-50 hover:text-blue-500 hover:border-blue-300'
                                  }
                                `}
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

              {/* Legend */}
              <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-blue-500 inline-block"/>
                  {t('availability.available','Available')}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block"/>
                  {t('availability.notAvailable','Not available')}
                </span>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
