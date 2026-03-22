import { useEffect, useState } from 'react';
import { Award, Zap, Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function TrainerCertifications() {
  const { t } = useTranslation();
  const [certs, setCerts]       = useState([]);
  const [weeks, setWeeks]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [expanded, setExpanded] = useState({});
  const [selectedWeek, setSelectedWeek]   = useState({});
  const [studentStatus, setStudentStatus] = useState({});
  const [generating, setGenerating]       = useState({});
  const [genMsg, setGenMsg]               = useState({});

  useEffect(() => {
    Promise.all([trainerApi.getCertifications(), trainerApi.getPublishedWeeks()])
      .then(([c, w]) => { setCerts(c.data||[]); setWeeks(w.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }, []);

  async function loadStudentStatus(certId, weekId) {
    if (!weekId) return;
    try {
      const r = await trainerApi.getCertStudentStatus({ weekId, certificationId: certId });
      setStudentStatus(s => ({ ...s, [`${certId}-${weekId}`]: r.data||[] }));
    } catch {}
  }

  async function generateTimetable(certId) {
    const weekId = selectedWeek[certId];
    if (!weekId) return alert(t('trainerCerts.selectWeek','Select a week first'));
    setGenerating(g => ({ ...g, [certId]: true }));
    setGenMsg(m => ({ ...m, [certId]: '' }));
    try {
      const r = await trainerApi.generateCertTimetable({ certificationId: certId, weekId });
      setGenMsg(m => ({ ...m, [certId]: `✅ ${r.data.scheduled} ${t('common.sessions','session(s)')} scheduled (${r.data.skipped} skipped)` }));
    } catch (e) {
      setGenMsg(m => ({ ...m, [certId]: `❌ ${e.response?.data?.message || t('timetable.generationFailed','Generation failed')}` }));
    } finally {
      setGenerating(g => ({ ...g, [certId]: false }));
    }
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('trainerCerts.title','My Certifications')}</h1>
        <p className="page-subtitle">{t('trainerCerts.subtitle','Manage your certification sessions and generate timetables')}</p>
      </div>

      {certs.length === 0 && (
        <div className="card p-10 text-center">
          <Award size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">{t('trainerCerts.noAssigned','No certifications assigned to you yet.')}</p>
        </div>
      )}

      {certs.map(cert => {
        const isOpen       = expanded[cert.id];
        const weekId       = selectedWeek[cert.id];
        const status       = studentStatus[`${cert.id}-${weekId}`] || [];
        const allSubmitted = status.length > 0 && status.every(s => s.hasSubmitted);

        return (
          <div key={cert.id} className="card overflow-hidden">
            {/* Header — tap to expand */}
            <button
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => setExpanded(e => ({ ...e, [cert.id]: !e[cert.id] }))}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={16} className="text-violet-600"/>
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{cert.name}</p>
                  <p className="text-xs text-gray-400">{cert.code} · {cert.durationHours}h</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0"/>}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 space-y-4">
                {/* Generate panel */}
                <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">{t('trainerCerts.generateTitle','Generate Certification Timetable')}</p>
                  <p className="text-xs text-amber-700">{t('trainerCerts.generateHint','Before generating: you must have submitted your availability, and all enrolled students must have submitted theirs.')}</p>

                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <label className="label">{t('trainerCerts.selectWeek','Select Week')}</label>
                      <select className="select" value={weekId||''}
                        onChange={e => {
                          const wid = e.target.value;
                          setSelectedWeek(s => ({ ...s, [cert.id]: wid }));
                          loadStudentStatus(cert.id, wid);
                        }}>
                        <option value="">{t('trainerCerts.chooseWeek','— Choose a published week —')}</option>
                        {weeks.map(w => <option key={w.id} value={w.id}>{w.label}{w.department?.name ? ` (${w.department.name})` : ''}</option>)}
                      </select>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => generateTimetable(cert.id)}
                      disabled={!weekId || generating[cert.id] || !allSubmitted}
                    >
                      <Zap size={15}/> {generating[cert.id] ? t('common.generating','Generating…') : t('trainerCerts.generate','Generate')}
                    </button>
                  </div>

                  {genMsg[cert.id] && <p className="text-sm">{genMsg[cert.id]}</p>}
                </div>

                {/* Student availability status */}
                {weekId && status.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Users size={14}/> {t('trainerCerts.studentStatusTitle','Enrolled Students — Availability Status')}
                    </p>
                    <div className="space-y-1">
                      {status.map(s => (
                        <div key={s.studentId} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-sm">
                          <span className="text-gray-800 truncate">{s.studentName} <span className="text-gray-400 text-xs">({s.matricule})</span></span>
                          {s.hasSubmitted
                            ? <span className="flex items-center gap-1 text-green-600 text-xs flex-shrink-0"><CheckCircle size={13}/> {t('trainerCerts.slots','{{count}} slot(s)',{count:s.slotCount})}</span>
                            : <span className="flex items-center gap-1 text-red-500 text-xs flex-shrink-0"><XCircle size={13}/> {t('trainerCerts.notSubmitted','Not submitted')}</span>}
                        </div>
                      ))}
                    </div>
                    {!allSubmitted && (
                      <p className="text-xs text-amber-600 mt-2">{t('trainerCerts.cannotGenerate','⚠ Cannot generate until all students have submitted availability.')}</p>
                    )}
                  </div>
                )}

                {weekId && status.length === 0 && (
                  <p className="text-sm text-gray-400">{t('trainerCerts.noStudentsEnrolled','No students enrolled in this certification yet.')}</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
