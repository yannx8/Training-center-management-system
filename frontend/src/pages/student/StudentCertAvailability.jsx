import { useEffect, useState } from 'react';
import { Save, Trash2, Info } from 'lucide-react';
import { studentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const DAYS_EN   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const TIME_SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00'];

function slotLabel(time) {
  const idx  = TIME_SLOTS.indexOf(time);
  const next = TIME_SLOTS[idx + 1] || '19:00';
  return `${time} – ${next}`;
}

export default function StudentCertAvailability() {
  const { t } = useTranslation();
  const [certs, setCerts]     = useState([]);
  const [weeks, setWeeks]     = useState([]);
  const [certId, setCertId]   = useState('');
  const [weekId, setWeekId]   = useState('');
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  useEffect(() => {
    Promise.all([studentApi.getCertEnrollments(), studentApi.getPublishedWeeks()])
      .then(([c, w]) => { setCerts(c.data||[]); setWeeks(w.data||[]); setLoading(false); })
      .catch(() => { setError(t('common.failedLoad','Failed to load data')); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!certId || !weekId) { setSlots([]); return; }
    studentApi.getCertAvailability({ certificationId: certId, weekId })
      .then(r => setSlots((r.data||[]).map(a => ({
        dayOfWeek: a.dayOfWeek,
        timeStart: a.timeStart.slice(0,5),
        timeEnd:   a.timeEnd.slice(0,5),
      }))))
      .catch(() => setSlots([]));
  }, [certId, weekId]);

  function isSelected(day, time) {
    return slots.some(s => s.dayOfWeek === day && s.timeStart === time);
  }

  function toggleSlot(day, time) {
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

  async function handleSave() {
    if (!certId || !weekId) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await studentApi.submitCertAvailability({ certificationId: certId, weekId, slots });
      setMsg(t('availability.certSaved','Availability saved!'));
    } catch (e) {
      setError(e.response?.data?.message || t('common.failedSave','Failed to save'));
    } finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  if (error && !certs.length) return <ErrorAlert message={error} />;

  const canShowGrid = certId && weekId;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('availability.certAvailabilityTitle','Certification Availability')}</h1>
        <p className="page-subtitle">{t('availability.certAvailabilitySubtitle','Submit your available slots for certification scheduling')}</p>
      </div>

      {certs.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          <p className="font-medium">{t('availability.notEnrolledCerts','You are not enrolled in any certifications.')}</p>
        </div>
      )}

      {certs.length > 0 && (
        <>
          <div className="card p-4 space-y-3">
            <div>
              <label className="label">{t('availability.selectCert','Certification')}</label>
              <select className="select" value={certId} onChange={e => { setCertId(e.target.value); setMsg(''); }}>
                <option value="">{t('availability.chooseCert','— Select certification —')}</option>
                {certs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('availability.chooseWeekLabel','Week')}</label>
              <select className="select" value={weekId} onChange={e => { setWeekId(e.target.value); setMsg(''); }}>
                <option value="">{t('availability.chooseWeekCert','— Select week —')}</option>
                {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
              </select>
            </div>

            {!canShowGrid && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                <Info size={14}/> {t('availability.selectBothFirst','Please select both a certification and a week first.')}
              </div>
            )}

            {canShowGrid && (
              <div className="flex flex-wrap gap-2">
                <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
                  <Save size={15}/> {saving ? t('common.saving','Saving…') : t('availability.saveAvailability','Save')}
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
          {error && <ErrorAlert message={error} />}

          {canShowGrid && (
            <div className="card overflow-hidden">
              <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-start gap-2 text-xs text-blue-700">
                <Info size={13} className="flex-shrink-0 mt-0.5"/>
                {t('availability.howToUse','Click a cell to mark that time as available. Click again to remove. Then click Save.')}
              </div>

              <div className="px-4 py-2 border-b border-gray-100">
                <p className="text-xs text-gray-600">
                  <span className="font-bold text-gray-900">{slots.length}</span>{' '}
                  {t('availability.slotsSelected','slot(s) selected.', { count: slots.length })}
                </p>
              </div>

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
                                className={`w-full h-8 rounded-lg text-xs font-semibold transition-all border
                                  ${sel
                                    ? 'bg-violet-500 text-white border-violet-600 shadow-sm hover:bg-violet-600'
                                    : 'bg-white text-gray-300 border-gray-200 hover:bg-violet-50 hover:text-violet-500 hover:border-violet-300'
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
                  <span className="w-4 h-4 rounded bg-violet-500 inline-block"/>
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
