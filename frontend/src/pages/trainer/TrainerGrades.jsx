import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Save, CheckCircle } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';

function letterGrade(n) {
  if (n >= 90) return 'A+';
  if (n >= 80) return 'A';
  if (n >= 70) return 'B';
  if (n >= 60) return 'C';
  if (n >= 50) return 'D';
  return 'F';
}

function ScoreColor({ v }) {
  const n = parseFloat(v);
  const cls = n >= 70 ? 'text-green-600' : n >= 50 ? 'text-amber-600' : 'text-red-600';
  return <span className={`font-bold text-sm ${cls}`}>{v ? `${letterGrade(n)}` : '—'}</span>;
}

function GradeRow({ student, subjectId, type, onSaved }) {
  const [val, setVal] = useState(student.existingGrade !== null ? String(student.existingGrade) : '');
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(false);

  async function save() {
    if (!val) return;
    setSaving(true);
    try {
      await trainerApi.upsertGrade({
        studentId:       student.studentId,
        courseId:        type === 'course' ? subjectId : undefined,
        certificationId: type === 'certification' ? subjectId : undefined,
        grade:           val,
      });
      setDone(true);
      setTimeout(() => setDone(false), 2000);
      if (onSaved) onSaved();
    } catch { alert('Failed to save grade'); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
        <p className="text-xs text-gray-400">{student.matricule}</p>
      </div>
      <div className="flex items-center gap-2">
        <input type="number" min="0" max="100" step="0.5"
          className="input w-20 text-center text-sm py-1.5"
          placeholder="0–100"
          value={val}
          onChange={e => setVal(e.target.value)}/>
        <ScoreColor v={val}/>
        <button className={`btn-sm ${done ? 'btn-secondary text-green-700' : 'btn-primary'}`}
          onClick={save} disabled={saving || !val}>
          {done ? <CheckCircle size={13}/> : saving ? '…' : <Save size={13}/>}
        </button>
      </div>
    </div>
  );
}

export default function TrainerGrades() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [open, setOpen]         = useState({});

  function load() {
    trainerApi.getStudentsForGrading()
      .then(r => { setSubjects(r.data || []); setLoading(false); })
      .catch(() => setError('Failed to load grading data'));
  }
  useEffect(load, []);

  if (loading) return <PageLoader/>;
  if (error)   return <ErrorAlert message={error}/>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Grade Entry</h1>
        <p className="page-subtitle">Record grades for your students. Click a subject to expand it.</p>
      </div>

      {subjects.length === 0 && (
        <div className="card p-12 text-center text-gray-400">
          <p>No courses or certifications assigned yet. Ask your administrator to assign you courses.</p>
        </div>
      )}

      {subjects.map(subj => {
        const key    = `${subj.type}-${subj.subjectId}`;
        const isOpen = open[key];
        const graded = subj.students.filter(s => s.existingGrade !== null).length;

        return (
          <div key={key} className="card overflow-hidden">
            <button className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))}>
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${subj.type === 'course' ? 'bg-amber-100' : 'bg-violet-100'}`}>
                  <span className={`text-xs font-bold ${subj.type === 'course' ? 'text-amber-700' : 'text-violet-700'}`}>
                    {subj.type === 'course' ? 'C' : 'X'}
                  </span>
                </div>
                <div className="text-left">
                  <p className="font-semibold text-gray-900 text-sm">{subj.subjectName}</p>
                  <p className="text-xs text-gray-400">
                    {subj.subjectCode}
                    {subj.programName  && ` · ${subj.programName}`}
                    {subj.levelName    && ` · ${subj.levelName}`}
                    {subj.semesterName && ` · ${subj.semesterName}`}
                    {' · '}{graded}/{subj.students.length} graded
                  </p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={15} className="text-gray-400"/> : <ChevronDown size={15} className="text-gray-400"/>}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                {subj.students.length === 0 && (
                  <p className="px-5 py-4 text-sm text-gray-400 italic">No students enrolled in this subject yet.</p>
                )}
                {subj.students.map(s => (
                  <GradeRow key={s.studentId} student={s} subjectId={subj.subjectId} type={subj.type} onSaved={load}/>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
