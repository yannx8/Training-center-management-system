import { useEffect, useState } from 'react';
import { Award, Zap, Users, CheckCircle, XCircle, ChevronDown, ChevronUp, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { trainerApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY_WEEK = { weekNumber: '', label: '', startDate: '', endDate: '', availabilityDeadline: '' };

export default function TrainerCertifications() {
  const { t } = useTranslation();
  const [certs, setCerts] = useState([]);
  const [certWeeks, setCertWeeks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState({});
  const [selectedWeek, setSelectedWeek] = useState({});
  const [studentStatus, setStudentStatus] = useState({});
  const [generating, setGenerating] = useState({});
  const [genMsg, setGenMsg] = useState({});
  const [weekModal, setWeekModal] = useState(null);
  const [weekForm, setWeekForm] = useState(EMPTY_WEEK);
  const [savingWeek, setSavingWeek] = useState(false);

  useEffect(() => {
    trainerApi.getCertifications()
      .then(c => { setCerts(c.data || []); setLoading(false); })
      .catch(() => { setError(t('common.failedLoad', 'Failed to load')); setLoading(false); });
  }, []);

  async function loadCertWeeks(certId) {
    try {
      const r = await trainerApi.getCertWeeks({ certificationId: certId });
      setCertWeeks(w => ({ ...w, [certId]: r.data || [] }));
    } catch { }
  }

  async function loadStudentStatus(certId, weekId) {
    if (!weekId) return;
    try {
      const r = await trainerApi.getCertStudentStatus({ weekId, certificationId: certId });
      setStudentStatus(s => ({ ...s, [`${certId}-${weekId}`]: r.data || [] }));
    } catch { }
  }

  async function handleCreateWeek(certId) {
    setSavingWeek(true);
    try {
      await trainerApi.createCertWeek({ certificationId: certId, ...weekForm, weekNumber: Number(weekForm.weekNumber) });
      setWeekModal(null);
      setWeekForm(EMPTY_WEEK);
      await loadCertWeeks(certId);
    } catch (e) {
      alert(e.response?.data?.message || t('common.failedSave', 'Failed'));
    } finally { setSavingWeek(false); }
  }

  async function handlePublishWeek(certId, weekId, isPublished) {
    try {
      if (isPublished) await trainerApi.unpublishCertWeek(weekId);
      else await trainerApi.publishCertWeek(weekId);
      await loadCertWeeks(certId);
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  }

  async function handleCloseWeek(certId, weekId) {
    if (!window.confirm("Are you sure you want to close this week? Scheduled hours will be deducted from certification's remaining hours.")) return;
    try {
      await trainerApi.closeCertWeek(weekId);
      await loadCertWeeks(certId);
    } catch (e) { alert(e.response?.data?.message || 'Failed to close week'); }
  }

  async function handleDeleteWeek(certId, weekId) {
    if (!window.confirm(t('common.deleteConfirm', 'Are you sure?'))) return;
    try {
      await trainerApi.deleteCertWeek(weekId);
      await loadCertWeeks(certId);
    } catch (e) { alert(e.response?.data?.message || 'Failed'); }
  }

  async function generateTimetable(certId) {
    const weekId = selectedWeek[certId];
    if (!weekId) return alert(t('trainerCerts.selectWeek', 'Select a week first'));
    setGenerating(g => ({ ...g, [certId]: true }));
    setGenMsg(m => ({ ...m, [certId]: '' }));
    try {
      const r = await trainerApi.generateCertTimetable({ certificationId: certId, weekId });
      setGenMsg(m => ({ ...m, [certId]: `${r.data.scheduled} ${t('common.sessions', 'session(s)')} scheduled (${r.data.skipped} skipped)` }));
    } catch (e) {
      setGenMsg(m => ({ ...m, [certId]: ` ${e.response?.data?.message || t('timetable.generationFailed', 'Generation failed')}` }));
    } finally {
      setGenerating(g => ({ ...g, [certId]: false }));
    }
  }

  function toggleExpand(certId) {
    const nowOpen = !expanded[certId];
    setExpanded(e => ({ ...e, [certId]: nowOpen }));
    if (nowOpen && !certWeeks[certId]) loadCertWeeks(certId);
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('trainerCerts.title', 'My Certifications')}</h1>
        <p className="page-subtitle">{t('trainerCerts.subtitle', 'Manage certification weeks and generate timetables')}</p>
      </div>

      {certs.length === 0 && (
        <div className="card p-10 text-center">
          <Award size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('trainerCerts.noAssigned', 'No certifications assigned to you yet.')}</p>
        </div>
      )}

      {certs.map(cert => {
        const isOpen = expanded[cert.id];
        const weeks = certWeeks[cert.id] || [];
        const pubWeeks = weeks.filter(w => w.status === 'published');
        const weekId = selectedWeek[cert.id];
        const status = studentStatus[`${cert.id}-${weekId}`] || [];
        const allSubmitted = status.length > 0 && status.every(s => s.hasSubmitted);

        return (
          <div key={cert.id} className="card overflow-hidden">
            {/* Header */}
            <button
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => toggleExpand(cert.id)}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={16} className="text-violet-600" />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{cert.name}</p>
                  <p className="text-xs text-gray-400">{cert.code} · {cert.durationHours}h · {pubWeeks.length} published week(s)</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0" /> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 p-4 space-y-5">

                {/*  Section 1: Cert Weeks Management  */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-gray-700">{t('trainerCerts.certWeeks', 'Certification Weeks')}</p>
                    <button
                      className="btn-primary btn-sm"
                      onClick={() => { setWeekModal(cert.id); setWeekForm(EMPTY_WEEK); }}
                    >
                      <Plus size={13} /> {t('trainerCerts.addWeek', 'Add Week')}
                    </button>
                  </div>

                  {weeks.length === 0 && (
                    <p className="text-sm text-gray-400 italic">{t('trainerCerts.noWeeksYet', 'No weeks created yet. Add one to start scheduling.')}</p>
                  )}

                  <div className="space-y-2">
                    {weeks.map(w => (
                      <div key={w.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gray-50 text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{w.label}</p>
                          <p className="text-xs text-gray-400">
                            Week {w.weekNumber} · {new Date(w.startDate).toLocaleDateString()} – {new Date(w.endDate).toLocaleDateString()}
                          </p>
                          {w.availabilityDeadline && (
                            <p className="text-xs text-amber-600 mt-0.5 font-medium">
                              Deadline: {new Date(w.availabilityDeadline).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${w.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                          {w.status}
                        </span>
                        <button
                          className="btn-ghost btn-sm btn-icon text-blue-500 flex-shrink-0"
                          title={w.status === 'published' ? 'Unpublish' : 'Publish'}
                          onClick={() => handlePublishWeek(cert.id, w.id, w.status === 'published')}
                        >
                          {w.status === 'published' ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                        {w.status === 'published' && (
                          <button
                            className="bg-rose-100 hover:bg-rose-200 text-rose-700 px-2 py-1 rounded text-xs font-medium flex-shrink-0"
                            onClick={() => handleCloseWeek(cert.id, w.id)}
                          >
                            Close
                          </button>
                        )}
                        <button
                          className="btn-ghost btn-sm btn-icon text-red-500 flex-shrink-0"
                          onClick={() => handleDeleteWeek(cert.id, w.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/*  Section 2: Generate Timetable  */}
                <div className="rounded-xl p-4 bg-amber-50 border border-amber-200 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">{t('trainerCerts.generateTitle', 'Generate Certification Timetable')}</p>
                  <p className="text-xs text-amber-700">{t('trainerCerts.generateHint', 'You must have submitted your availability, and all enrolled students must have submitted theirs.')}</p>

                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex-1 min-w-[180px]">
                      <label className="label">{t('trainerCerts.selectWeek', 'Select Published Week')}</label>
                      <select
                        className="select"
                        value={weekId || ''}
                        onChange={e => {
                          const wid = e.target.value;
                          setSelectedWeek(s => ({ ...s, [cert.id]: wid }));
                          loadStudentStatus(cert.id, wid);
                        }}
                      >
                        <option value="">{t('trainerCerts.chooseWeek', '— Choose a published week —')}</option>
                        {pubWeeks.map(w => (
                          <option key={w.id} value={w.id}>{w.label} (Week {w.weekNumber})</option>
                        ))}
                      </select>
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => generateTimetable(cert.id)}
                      disabled={!weekId || generating[cert.id] || !allSubmitted}
                    >
                      <Zap size={15} /> {generating[cert.id] ? t('common.generating', 'Generating…') : t('trainerCerts.generate', 'Generate')}
                    </button>
                  </div>

                  {genMsg[cert.id] && <p className="text-sm">{genMsg[cert.id]}</p>}
                </div>

                {/*  Section 3: Student Availability Status  */}
                {weekId && status.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Users size={14} /> {t('trainerCerts.studentStatusTitle', 'Enrolled Students — Availability Status')}
                    </p>
                    <div className="space-y-1">
                      {status.map(s => (
                        <div key={s.studentId} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 text-sm">
                          <span className="text-gray-800 truncate">{s.studentName} <span className="text-gray-400 text-xs">({s.matricule})</span></span>
                          {s.hasSubmitted
                            ? <span className="flex items-center gap-1 text-green-600 text-xs flex-shrink-0"><CheckCircle size={13} /> {s.slotCount} slot(s)</span>
                            : <span className="flex items-center gap-1 text-red-500 text-xs flex-shrink-0"><XCircle size={13} /> {t('trainerCerts.notSubmitted', 'Not submitted')}</span>
                          }
                        </div>
                      ))}
                    </div>
                    {!allSubmitted && (
                      <p className="text-xs text-amber-600 mt-2">⚠ {t('trainerCerts.cannotGenerate', 'Cannot generate until all students have submitted availability.')}</p>
                    )}
                  </div>
                )}

                {weekId && status.length === 0 && (
                  <p className="text-sm text-gray-400">{t('trainerCerts.noStudentsEnrolled', 'No students enrolled in this certification yet.')}</p>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Week Modal */}
      <Modal
        open={weekModal !== null}
        onClose={() => setWeekModal(null)}
        title={t('trainerCerts.addWeek', 'Add Certification Week')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setWeekModal(null)}>{t('common.cancel', 'Cancel')}</button>
            <button className="btn-primary" onClick={() => handleCreateWeek(weekModal)} disabled={savingWeek}>
              {savingWeek ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('weeks.weekNumber', 'Week Number')}</label>
              <input type="number" min={1} className="input" value={weekForm.weekNumber}
                onChange={e => setWeekForm(f => ({ ...f, weekNumber: e.target.value }))} />
            </div>
            <div><label className="label">{t('weeks.label', 'Label')}</label>
              <input className="input" placeholder="e.g. Cert Week 1" value={weekForm.label}
                onChange={e => setWeekForm(f => ({ ...f, label: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('weeks.startDate', 'Start Date')}</label>
              <input type="date" className="input" value={weekForm.startDate}
                onChange={e => setWeekForm(f => ({ ...f, startDate: e.target.value }))} />
            </div>
            <div><label className="label">{t('weeks.endDate', 'End Date')}</label>
              <input type="date" className="input" value={weekForm.endDate}
                onChange={e => setWeekForm(f => ({ ...f, endDate: e.target.value }))} />
            </div>
            <div className="col-span-2"><label className="label">Availability Deadline (Optional)</label>
              <input type="datetime-local" className="input" value={weekForm.availabilityDeadline}
                onChange={e => setWeekForm(f => ({ ...f, availabilityDeadline: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}