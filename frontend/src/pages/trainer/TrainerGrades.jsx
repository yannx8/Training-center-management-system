import { useEffect, useState } from 'react';
import { Save, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

function ScoreColor({ v }) {
  const n = parseFloat(v);
  if (!v || isNaN(n)) return null;
  const cls = n >= 70 ? 'text-green-600' : n >= 50 ? 'text-amber-600' : 'text-red-600';
  return <span className={`text-sm font-bold ${cls}`}>{n >= 70 ? '✓' : n >= 50 ? '~' : '✗'}</span>;
}

function GradeRow({ student, subjectId, type, onSaved }) {
  const { t } = useTranslation();
  const [val, setVal]     = useState(student.existingGrade !== null ? String(student.existingGrade) : '');
  const [saving, setSaving] = useState(false);
  const [done, setDone]   = useState(student.existingGrade !== null);

  async function save() {
    if (!val) return;
    setSaving(true);
    try {
      await trainerApi.upsertGrade({
        studentId:  student.studentId,
        grade:      parseFloat(val),
        ...(type === 'course'        ? { courseId: subjectId }        : {}),
        ...(type === 'certification' ? { certificationId: subjectId } : {}),
      });
      setDone(true);
      onSaved();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave','Failed to save')); }
    finally { setSaving(false); }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{student.fullName}</p>
        <p className="text-xs text-gray-400">{student.matricule}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <input
          type="number" min="0" max="100" step="0.5"
          className="input w-20 text-center text-sm py-2"
          placeholder="0–100"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <ScoreColor v={val} />
        <button
          className={`btn-sm ${done ? 'btn-secondary text-green-700' : 'btn-primary'}`}
          onClick={save}
          disabled={saving || !val}
        >
          {done ? <CheckCircle size={13}/> : saving ? '…' : <Save size={13}/>}
        </button>
      </div>
    </div>
  );
}

export default function TrainerGrades() {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [open, setOpen]         = useState({});

  function load() {
    trainerApi.getStudentsForGrading()
      .then(r => { setSubjects(r.data || []); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load data')));
  }
  useEffect(load, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('grades.title','Grade Entry')}</h1>
        <p className="page-subtitle">{t('grades.subtitle','Record grades for your students. Click a subject to expand it.')}</p>
      </div>

      {subjects.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          <p>{t('grades.noCoursesAssigned','No courses or certifications assigned yet.')}</p>
        </div>
      )}

      {subjects.map(subj => {
        const key    = `${subj.type}-${subj.subjectId}`;
        const isOpen = open[key];
        const graded = subj.students.filter(s => s.existingGrade !== null).length;
        const isCourse = subj.type === 'course';

        return (
          <div key={key} className="card overflow-hidden">
            {/* Subject header — tap to expand */}
            <button
              className="w-full px-4 py-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors"
              onClick={() => setOpen(o => ({ ...o, [key]: !o[key] }))}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${isCourse ? 'bg-amber-100' : 'bg-violet-100'}`}>
                  <span className={`text-xs font-bold ${isCourse ? 'text-amber-700' : 'text-violet-700'}`}>
                    {isCourse ? 'C' : 'X'}
                  </span>
                </div>
                <div className="text-left min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{subj.subjectName}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {subj.subjectCode}
                    {subj.programName  && ` · ${subj.programName}`}
                    {subj.levelName    && ` · ${subj.levelName}`}
                    {subj.semesterName && ` · ${subj.semesterName}`}
                    {' · '}{t('grades.graded','{{graded}}/{{total}} graded',{graded,total:subj.students.length})}
                  </p>
                </div>
              </div>
              {isOpen ? <ChevronUp size={15} className="text-gray-400 flex-shrink-0"/> : <ChevronDown size={15} className="text-gray-400 flex-shrink-0"/>}
            </button>

            {isOpen && (
              <div className="border-t border-gray-100">
                {subj.students.length === 0 && (
                  <p className="px-4 py-4 text-sm text-gray-400 italic">{t('grades.noStudentsEnrolled','No students enrolled yet.')}</p>
                )}
                {subj.students.map(s => (
                  <GradeRow
                    key={s.studentId}
                    student={s}
                    subjectId={subj.subjectId}
                    type={subj.type}
                    onSaved={load}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
