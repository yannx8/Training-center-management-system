// FILE: frontend/src/pages/trainer/TrainerAvailability.jsx
import { useEffect, useState } from 'react';
import { Save, Trash2, Info, Lock } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const DAYS_EN    = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

function slotLabel(time) {
  const idx  = TIME_SLOTS.indexOf(time);
  const next = TIME_SLOTS[idx + 1] || '19:00';
  return `${time} – ${next}`;
}

export default function TrainerAvailability() {
  const { t } = useTranslation();
  const [week, setWeek]         = useState(null);   // the single active published week
  const [slots, setSlots]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError]       = useState('');
  const [msg, setMsg]           = useState('');

  useEffect(() => {
    trainerApi.getPublishedWeeks()
      .then(async r => {
        const weeks = r.data || [];
        // Use the most recent published week
        const latest = weeks[0] || null;
        setWeek(latest);

        if (latest) {
          // Load existing availability for this week
          const [avail, lock] = await Promise.all([
            trainerApi.getAvailability({ weekId: latest.id }),
            trainerApi.getLockStatus ? trainerApi.getLockStatus(latest.id).catch(() => ({ data: { isLocked: false } })) : Promise.resolve({ data: { isLocked: false } }),
          ]);
          setSlots((avail.data || []).map(a => ({
            dayOfWeek: a.dayOfWeek,
            timeStart: a.timeStart.slice(0, 5),
            timeEnd:   a.timeEnd.slice(0, 5),
          })));
          setIsLocked(lock?.data?.isLocked || false);
        }
        setLoading(false);
      })
      .catch(() => { setError(t('common.failedLoad', 'Failed to load')); setLoading(false); });
  }, []);

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
    for (const day of DAYS_EN)
      for (let i = 0; i < TIME_SLOTS.length - 1; i++)
        all.push({ dayOfWeek: day, timeStart: TIME_SLOTS[i], timeEnd: TIME_SLOTS[i + 1] });
    setSlots(all);
  }

  async function handleSave() {
    if (!week || isLocked) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await trainerApi.submitAvailability({ weekId: week.id, slots });
      setMsg(t('availability.saved', 'Availability saved successfully!'));
    } catch (e) {
      setError(e.response?.data?.message || t('common.failedSave', 'Failed to save'));
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;

  const selectedCount = slots.length;
  const daysCovered   = DAYS_EN.filter(d => slots.some(s => s.dayOfWeek === d)).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('availability.myAvailabilityTitle', 'My Availability')}</h1>
        <p className="page-subtitle">{t('availability.myAvailabilitySubtitle', 'Mark the time slots when you are available to teach')}</p>
      </div>

      {/* No published week */}
      {!week && !error && (
        <div className="card p-10 text-center">
          <Info size={32} className="mx-auto text-gray-300 mb-3"/>
          <p className="font-medium text-gray-600">{t('availability.noPublishedWeeks', 'No published weeks yet')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('availability.noPublishedWeeksHint', 'Your HOD needs to publish an academic week before you can submit availability.')}</p>
        </div>
      )}

      {error && <ErrorAlert message={error} />}

      {/* Active week */}
      {week && (
        <>
          {/* Week info banner */}
          <div className="card px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-sm font-semibold text-gray-900">{week.label}</p>
              <p className="text-xs text-gray-400">
                {new Date(week.startDate).toLocaleDateString()} – {new Date(week.endDate).toLocaleDateString()}
                {week.department?.name ? ` · ${week.department.name}` : ''}
              </p>
            </div>
            {isLocked && (
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                <Lock size={12}/> {t('availability.locked', 'Locked by HOD')}
              </div>
            )}
          </div>

          {/* Actions */}
          {!isLocked && (
            <div className="flex flex-wrap gap-2">
              <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                <Save size={15}/> {saving ? t('common.saving', 'Saving…') : t('availability.saveAvailability', 'Save Availability')}
              </button>
              <button className="btn-secondary" onClick={selectAll}>
                {t('availability.selectAll', 'Select All')}
              </button>
              <button className="btn-secondary" onClick={() => setSlots([])}>
                <Trash2 size={15}/> {t('availability.clearAll', 'Clear')}
              </button>
            </div>
          )}

          {msg && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">✓ {msg}</div>}

          {/* Grid */}
          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-start gap-2 text-xs text-blue-700">
              <Info size={13} className="flex-shrink-0 mt-0.5"/>
              <span>
                {isLocked
                  ? t('availability.lockedNote', 'This week is locked — availability cannot be edited.')
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
                    <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 w-28 sticky left-0 bg-gray-50 z-10">
                      {t('time.timeSlot', 'Time')}
                    </th>
                    {DAYS_EN.map(d => (
                      <th key={d} className="px-1 py-2.5 text-center text-xs font-semibold text-gray-600 min-w-[72px]">
                        {t(`days.${d}`, d)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TIME_SLOTS.slice(0, -1).map((time, ri) => (
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
                              className={`w-full h-8 rounded-lg text-xs font-semibold transition-all border
                                ${isLocked
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
                <span className="w-4 h-4 rounded bg-blue-500 inline-block"/>
                {t('availability.available', 'Available')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-white border border-gray-200 inline-block"/>
                {t('availability.notAvailable', 'Not available')}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}