import { useEffect, useState } from 'react';
import { Save, Trash2, Info } from 'lucide-react';
import { studentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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

export default function StudentCertAvailability() {
  const { t } = useTranslation();
  const [certs, setCerts] = useState([]);
  const [certId, setCertId] = useState('');
  const [activeWeek, setActiveWeek] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekLoading, setWeekLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    studentApi.getCertEnrollments()
      .then(r => {
        const data = r.data || [];
        setCerts(data);
        if (data.length === 1) setCertId(String(data[0].certificationId));
        setLoading(false);
      })
      .catch(() => { setError(t('common.failedLoad', 'Failed to load data')); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!certId) { setActiveWeek(null); setSlots([]); return; }
    setWeekLoading(true);
    setActiveWeek(null);
    setSlots([]);
    setMsg('');
    studentApi.getPublishedWeeks({ certificationId: certId })
      .then(async r => {
        const latest = (r.data || [])[0] || null;
        setActiveWeek(latest);
        if (latest) {
          const avail = await studentApi.getCertAvailability({ certificationId: certId, weekId: latest.id }).catch(() => ({ data: [] }));
          setSlots((avail.data || []).map(a => ({
            dayOfWeek: a.dayOfWeek,
            timeStart: a.timeStart.slice(0, 5),
            timeEnd: a.timeEnd.slice(0, 5)
          })));
        }
        setWeekLoading(false);
      })
      .catch(() => setWeekLoading(false));
  }, [certId]);

  function isSelected(day, time) {
    return slots.some(s => s.dayOfWeek === day && s.timeStart === time);
  }

  function toggleSlot(day, slot) {
    setMsg(''); setError('');
    const exists = slots.find(s => s.dayOfWeek === day && s.timeStart === slot.start);
    if (exists) {
      setSlots(p => p.filter(x => !(x.dayOfWeek === day && x.timeStart === slot.start)));
    } else {
      setSlots(p => [...p, { dayOfWeek: day, timeStart: slot.start, timeEnd: slot.end }]);
    }
  }

  async function handleSave() {
    if (!certId || !activeWeek) return;
    setSaving(true); setMsg(''); setError('');
    try {
      await studentApi.submitCertAvailability({ certificationId: certId, weekId: activeWeek.id, slots });
      setMsg(t('availability.certSaved', 'Availability saved!'));
    } catch (e) {
      setError(e.response?.data?.message || t('common.failedSave', 'Failed to save'));
    } finally {
      setSaving(false);
    }
  }

  const certName = certs.find(c => String(c.certificationId) === String(certId))?.certification?.name || '';

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('availability.certAvailabilityTitle', 'Certification Availability')}</h1>
        <p className="page-subtitle">{t('availability.certAvailabilitySubtitle', 'Submit your available slots for certification scheduling')}</p>
      </div>

      {certs.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          <p className="font-medium">{t('availability.notEnrolledCerts', 'You are not enrolled in any certifications.')}</p>
        </div>
      )}

      {certs.length > 1 && (
        <div className="card p-4">
          <label className="label">{t('availability.selectCert', 'Certification')}</label>
          <select className="select" value={certId} onChange={e => { setCertId(e.target.value); setMsg(''); setError(''); }}>
            <option value="">{t('availability.chooseCert', '— Select certification —')}</option>
            {certs.map(c => <option key={c.id} value={c.certificationId}>{c.certification?.name}</option>)}
          </select>
        </div>
      )}

      {!certId && certs.length > 1 && (
        <div className="card p-8 text-center text-gray-400">
          <p>{t('availability.chooseCert', 'Select a certification above.')}</p>
        </div>
      )}

      {certId && weekLoading && <PageLoader />}

      {certId && !weekLoading && !activeWeek && (
        <div className="card p-10 text-center">
          <Info size={32} className="mx-auto text-gray-300 mb-3" />
          <p className="font-medium text-gray-600">{t('availability.noPublishedWeeks', 'No published weeks yet')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('availability.noCertWeeksHint', 'Your trainer needs to publish a certification week before you can submit availability.')}</p>
        </div>
      )}

      {certId && !weekLoading && activeWeek && (
        <>
          <div className="card px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{certName} — {activeWeek.label}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Week {activeWeek.weekNumber} · {new Date(activeWeek.startDate).toLocaleDateString()} – {new Date(activeWeek.endDate).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn-primary flex-1 justify-center" onClick={handleSave} disabled={saving}>
              <Save size={15} /> {saving ? t('common.saving', 'Saving…') : t('availability.saveAvailability', 'Save Availability')}
            </button>
            <button className="btn-secondary" onClick={() => setSlots([])}>
              <Trash2 size={15} /> {t('availability.clearAll', 'Clear')}
            </button>
          </div>

          {msg && <div className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-2">✓ {msg}</div>}
          {error && <ErrorAlert message={error} />}

          <div className="card overflow-hidden">
            <div className="px-4 py-2.5 bg-blue-50 border-b border-blue-100 flex items-start gap-2 text-xs text-blue-700">
              <Info size={13} className="flex-shrink-0 mt-0.5" />
              {t('availability.howToUse', 'Click a cell to mark it as available. Click again to remove. Then save.')}
            </div>
            <div className="px-4 py-2 border-b border-gray-100">
              <p className="text-xs text-gray-600">
                <span className="font-bold text-gray-900">{slots.length}</span> {t('availability.slotsSelected', 'slot(s) selected')}
              </p>
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
                  {TIME_SLOTS.map((slot, ri) => (
                    <tr key={slot.start} className={`border-b border-gray-100 ${ri % 2 === 0 ? 'bg-white' : 'bg-gray-50/40'}`}>
                      <td className="px-3 py-1.5 sticky left-0 bg-inherit z-10">
                        <span className="text-xs font-mono font-semibold text-gray-700 whitespace-nowrap">
                          {slotLabel(slot)}
                        </span>
                      </td>
                      {DAYS_EN.map(day => {
                        const sel = isSelected(day, slot.start);
                        return (
                          <td key={day} className="px-1 py-1 text-center">
                            <button
                              onClick={() => toggleSlot(day, slot)}
                              className={`w-full h-8 rounded-lg text-xs font-semibold transition-all border ${
                                sel
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
          </div>
        </>
      )}
    </div>
  );
}