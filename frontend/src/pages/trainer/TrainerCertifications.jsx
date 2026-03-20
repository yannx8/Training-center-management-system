import { useEffect, useState } from "react";
import { Award, Zap, Users, CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { trainerApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function TrainerCertifications() {
  const [certs, setCerts]     = useState([]);
  const [weeks, setWeeks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");
  // Per-cert state
  const [expanded, setExpanded] = useState({});
  const [selectedWeek, setSelectedWeek] = useState({});
  const [studentStatus, setStudentStatus] = useState({});
  const [generating, setGenerating] = useState({});
  const [genMsg, setGenMsg]   = useState({});

  useEffect(() => {
    Promise.all([trainerApi.getCertifications(), trainerApi.getPublishedWeeks()])
      .then(([c,w]) => { setCerts(c.data||[]); setWeeks(w.data||[]); setLoading(false); })
      .catch(() => setError("Failed to load"));
  }, []);

  async function loadStudentStatus(certId, weekId) {
    if (!weekId) return;
    try {
      const r = await trainerApi.getCertStudentStatus({ weekId, certificationId:certId });
      setStudentStatus(s => ({ ...s, [`${certId}-${weekId}`]:r.data }));
    } catch {}
  }

  async function generateTimetable(certId) {
    const weekId = selectedWeek[certId];
    if (!weekId) return alert("Select a week first");
    setGenerating(g => ({ ...g, [certId]:true }));
    setGenMsg(m => ({ ...m, [certId]:"" }));
    try {
      const r = await trainerApi.generateCertTimetable({ certificationId:certId, weekId });
      setGenMsg(m => ({ ...m, [certId]:`✅ ${r.data.scheduled} session(s) scheduled (${r.data.skipped} skipped)` }));
    } catch(e) {
      setGenMsg(m => ({ ...m, [certId]:`❌ ${e.response?.data?.message || "Generation failed"}` }));
    } finally {
      setGenerating(g => ({ ...g, [certId]:false }));
    }
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">My Certifications</h1>
        <p className="page-subtitle">Manage your certification sessions and generate timetables</p>
      </div>

      {certs.length === 0 && (
        <div className="card p-12 text-center">
          <Award size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">No certifications assigned to you yet.</p>
        </div>
      )}

      {certs.map(cert => {
        const isOpen = expanded[cert.id];
        const weekId = selectedWeek[cert.id];
        const status = studentStatus[`${cert.id}-${weekId}`] || [];
        const allSubmitted = status.length > 0 && status.every(s => s.hasSubmitted);

        return (
          <div key={cert.id} className="card">
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => setExpanded(e => ({ ...e, [cert.id]:!e[cert.id] }))}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={16} className="text-violet-600"/>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{cert.name}</p>
                  <p className="text-xs text-gray-400">{cert.code} · {cert.durationHours}h</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400"/> : <ChevronDown size={16} className="text-gray-400"/>}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100 px-5 py-5 space-y-5">
                {/* Week selector + generate */}
                <div className="card p-4 bg-amber-50 border border-amber-200 space-y-3">
                  <p className="text-sm font-semibold text-amber-800">Generate Certification Timetable</p>
                  <p className="text-xs text-amber-700">
                    Before generating: you must have submitted your availability for the week, and all enrolled students must have submitted their availability.
                  </p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div>
                      <label className="label">Select Week</label>
                      <select className="select w-56" value={weekId||""}
                        onChange={e => {
                          const wid = e.target.value;
                          setSelectedWeek(s => ({ ...s, [cert.id]:wid }));
                          loadStudentStatus(cert.id, wid);
                        }}>
                        <option value="">— Choose a published week —</option>
                        {weeks.map(w => <option key={w.id} value={w.id}>{w.label} ({w.department?.name})</option>)}
                      </select>
                    </div>
                    <button className="btn-primary" onClick={() => generateTimetable(cert.id)} disabled={!weekId || generating[cert.id] || !allSubmitted}>
                      <Zap size={15}/> {generating[cert.id] ? "Generating…" : "Generate"}
                    </button>
                  </div>
                  {genMsg[cert.id] && <p className="text-sm">{genMsg[cert.id]}</p>}
                </div>

                {/* Student availability status */}
                {weekId && status.length > 0 && (
                  <div>
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <Users size={14}/> Enrolled Students — Availability Status
                    </p>
                    <div className="space-y-1">
                      {status.map(s => (
                        <div key={s.studentId} className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-50 text-sm">
                          <span className="text-gray-800">{s.studentName} <span className="text-gray-400 text-xs">({s.matricule})</span></span>
                          {s.hasSubmitted
                            ? <span className="flex items-center gap-1 text-green-600 text-xs"><CheckCircle size={13}/> {s.slotCount} slot(s)</span>
                            : <span className="flex items-center gap-1 text-red-500 text-xs"><XCircle size={13}/> Not submitted</span>}
                        </div>
                      ))}
                    </div>
                    {!allSubmitted && <p className="text-xs text-amber-600 mt-2">⚠ Cannot generate until all students have submitted availability.</p>}
                  </div>
                )}
                {weekId && status.length === 0 && (
                  <p className="text-sm text-gray-400">No students enrolled in this certification yet.</p>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
