// FILE: src/pages/trainer/TrainerGrades.jsx
import { useEffect, useState } from "react";
import { BarChart2, Save, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { trainerApi } from "../../api";
import { PageLoader, ErrorAlert, Badge } from "../../components/ui";

function gradeColor(g) {
  if (!g) return "text-gray-400";
  const n = parseFloat(g);
  if (n >= 70) return "text-green-600";
  if (n >= 50) return "text-yellow-600";
  return "text-red-600";
}

// One editable row per student per course/cert
function GradeRow({ entry, onSave }) {
  const [value, setValue] = useState(entry.grade !== null ? String(entry.grade) : "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  async function handleSave() {
    if (!value) return;
    setSaving(true);
    try {
      await onSave({ ...entry, grade: value });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally { setSaving(false); }
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{entry.studentName}</p>
        <p className="text-xs text-gray-400">{entry.matricule}</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min="0" max="100" step="0.5"
          className="input w-20 text-center text-sm py-1.5"
          placeholder="0–100"
          value={value}
          onChange={e => setValue(e.target.value)} />
        <span className={`text-sm font-bold w-8 text-center ${gradeColor(value)}`}>
          {value ? (parseFloat(value) >= 90 ? "A+" : parseFloat(value) >= 80 ? "A" : parseFloat(value) >= 70 ? "B" : parseFloat(value) >= 60 ? "C" : parseFloat(value) >= 50 ? "D" : "F") : "—"}
        </span>
        <button className={`btn-sm ${saved ? "btn-secondary text-green-600" : "btn-primary"}`}
          onClick={handleSave} disabled={saving || !value}>
          {saved ? <CheckCircle size={14} /> : saving ? "…" : <Save size={14} />}
        </button>
      </div>
    </div>
  );
}

export default function TrainerGrades() {
  const [courses, setCourses] = useState([]);
  const [certs, setCerts]     = useState([]);
  const [allGrades, setAllGrades] = useState([]);
  const [students, setStudents]   = useState({}); // courseId/certId → [students]
  const [expanded, setExpanded]   = useState({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  async function load() {
    try {
      const [cr, ce, gr] = await Promise.all([
        trainerApi.getCourses(),
        trainerApi.getCertifications(),
        trainerApi.getGrades(),
      ]);
      setCourses(cr.data || []);
      setCerts(ce.data || []);
      setAllGrades(gr.data || []);
      setLoading(false);
    } catch { setError("Failed to load grade data"); setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  // Fetch students enrolled in a course's program session
  async function loadStudents(key, programId, certificationId) {
    if (students[key]) return;
    try {
      // Use the grades already fetched to figure out which students exist
      // In a real app you'd have a dedicated endpoint; we'll derive from existing grades + fetch fresh
      const { default: api } = await import("../../api/axiosInstance");
      let res;
      if (programId) {
        res = await api.get(`/trainer/students-for-course`, { params: { programId } }).catch(() => ({ data: { data: [] } }));
      } else if (certificationId) {
        res = await api.get(`/trainer/students-for-cert`, { params: { certificationId } }).catch(() => ({ data: { data: [] } }));
      }
      setStudents(s => ({ ...s, [key]: res?.data?.data || [] }));
    } catch { setStudents(s => ({ ...s, [key]: [] })); }
  }

  function toggle(key) {
    setExpanded(e => ({ ...e, [key]: !e[key] }));
  }

  async function handleSave(entry) {
    await trainerApi.upsertGrade({
      studentId: entry.studentId,
      courseId: entry.courseId || undefined,
      certificationId: entry.certificationId || undefined,
      grade: entry.grade,
    });
    load();
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  // Group grades by subject
  const gradesByCourse = {};
  for (const g of allGrades) {
    const key = g.courseId ? `c-${g.courseId}` : `cert-${g.certificationId}`;
    if (!gradesByCourse[key]) gradesByCourse[key] = [];
    gradesByCourse[key].push(g);
  }

  const allSubjects = [
    ...courses.map(c => ({ type: "course", id: c.id, name: c.name, code: c.code, key: `c-${c.id}`, sub: c.session?.program?.name })),
    ...certs.map(c => ({ type: "cert", id: c.id, name: c.name, code: c.code, key: `cert-${c.id}`, sub: "Certification" })),
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Grade Entry</h1>
        <p className="page-subtitle">Enter and manage student grades for your courses and certifications</p>
      </div>

      {allSubjects.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <BarChart2 size={36} className="mx-auto mb-3 opacity-40" />
          <p>No courses or certifications assigned yet.</p>
        </div>
      )}

      {allSubjects.map(subj => {
        const grades = gradesByCourse[subj.key] || [];
        const isOpen = expanded[subj.key];
        return (
          <div key={subj.key} className="card">
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => toggle(subj.key)}>
              <div className="flex items-center gap-3 text-left">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${subj.type === "course" ? "bg-amber-100" : "bg-violet-100"}`}>
                  <BarChart2 size={16} className={subj.type === "course" ? "text-amber-600" : "text-violet-600"} />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{subj.name}</p>
                  <p className="text-xs text-gray-400">{subj.code} · {subj.sub} · {grades.length} grade{grades.length !== 1 ? "s" : ""} entered</p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                {grades.length === 0 && (
                  <p className="px-5 py-4 text-sm text-gray-400 italic">No grades entered yet for this subject.</p>
                )}
                {grades.map(g => (
                  <GradeRow key={g.id}
                    entry={{
                      studentId: g.studentId,
                      courseId: g.courseId,
                      certificationId: g.certificationId,
                      studentName: g.student?.user?.fullName || "Unknown",
                      matricule: g.student?.matricule || "",
                      grade: g.grade,
                    }}
                    onSave={handleSave}
                  />
                ))}
                <div className="px-5 py-3 bg-gray-50 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    To add grades for students who don't appear here, the student must first be enrolled in this {subj.type === "course" ? "program" : "certification"}.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
