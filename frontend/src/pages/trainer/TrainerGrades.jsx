import { useEffect, useState, useMemo } from 'react';
import { Save, ChevronDown, ChevronUp, CheckCircle, Search, BookOpen, Award } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

// ── Score indicator ─────────────────────────────────────────────
function ScoreBadge({ value }) {
  const n = parseFloat(value);
  if (!value || isNaN(n)) return null;
  const cls = n >= 70 ? 'text-green-600 bg-green-50' : n >= 50 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50';
  return (
    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${cls}`}>
      {n >= 70 ? '✓' : n >= 50 ? '~' : '✗'}
    </span>
  );
}

// ── Single grade row ────────────────────────────────────────────
function GradeRow({ student, subjectId, type, onSaved }) {
  const { t } = useTranslation();
  const [val, setVal]       = useState(student.existingGrade !== null ? String(student.existingGrade) : '');
  const [saving, setSaving] = useState(false);
  const [done, setDone]     = useState(student.existingGrade !== null);

  async function save() {
    if (!val) return;
    setSaving(true);
    try {
      await trainerApi.upsertGrade({
        studentId:       student.studentId,
        grade:           parseFloat(val),
        ...(type === 'course'         ? { courseId: subjectId }        : {}),
        ...(type === 'certification'  ? { certificationId: subjectId } : {}),
      });
      setDone(true);
      onSaved();
    } catch (e) {
      alert(e.response?.data?.message || t('common.failedSave', 'Failed to save'));
    } finally { setSaving(false); }
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      {/* Avatar initials */}
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
        {student.fullName?.charAt(0).toUpperCase()}
      </div>
      {/* Name + matricule */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{student.fullName}</p>
        <p className="text-xs text-gray-400">{student.matricule}</p>
      </div>
      {/* Grade input group */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          inputMode="decimal"
          className="w-16 px-2 py-1.5 text-center text-sm font-semibold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          placeholder="—"
          value={val}
          onChange={e => { setVal(e.target.value); setDone(false); }}
        />
        <ScoreBadge value={val} />
        <button
          onClick={save}
          disabled={saving || !val}
          title={t('grades.saveGrade', 'Save')}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
            done
              ? 'bg-green-100 text-green-600'
              : saving
              ? 'bg-gray-100 text-gray-400'
              : 'bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-40'
          }`}
        >
          {done ? <CheckCircle size={14}/> : saving ? '…' : <Save size={14}/>}
        </button>
      </div>
    </div>
  );
}

// ── Subject card (collapsible) ──────────────────────────────────
function SubjectCard({ subj, onSaved }) {
  const { t } = useTranslation();
  const [open, setOpen]           = useState(false);
  const [search, setSearch]       = useState('');
  const isCourse = subj.type === 'course';

  const graded = subj.students.filter(s => s.existingGrade !== null).length;
  const total  = subj.students.length;
  const pct    = total > 0 ? Math.round((graded / total) * 100) : 0;

  const filtered = useMemo(() =>
    search.trim()
      ? subj.students.filter(s => s.fullName?.toLowerCase().includes(search.toLowerCase()))
      : subj.students,
    [search, subj.students]
  );

  return (
    <div className="card overflow-hidden">
      {/* Header — tap to expand */}
      <button
        className="w-full px-4 py-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
        onClick={() => setOpen(o => !o)}
      >
        {/* Icon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isCourse ? 'bg-amber-100' : 'bg-violet-100'}`}>
          {isCourse
            ? <BookOpen size={18} className="text-amber-600"/>
            : <Award size={18} className="text-violet-600"/>}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 text-sm truncate">{subj.subjectName}</p>
          <p className="text-xs text-gray-400 truncate">
            {subj.subjectCode}
            {subj.programName  && ` · ${subj.programName}`}
            {subj.levelName    && ` · ${subj.levelName}`}
            {subj.semesterName && ` · ${subj.semesterName}`}
          </p>
        </div>

        {/* Progress pill */}
        <div className="flex-shrink-0 text-right mr-1">
          <p className="text-xs font-semibold text-gray-700">{graded}/{total}</p>
          <div className="w-16 h-1.5 bg-gray-200 rounded-full mt-1 overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full transition-all" style={{ width: `${pct}%` }}/>
          </div>
        </div>

        {open
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0"/>
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0"/>}
      </button>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-gray-100">
          {/* Search bar */}
          {subj.students.length > 3 && (
            <div className="px-4 py-2.5 border-b border-gray-50">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"/>
                <input
                  className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent placeholder-gray-400"
                  placeholder={t('grades.searchStudents', 'Search students by name…')}
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {search && (
                <p className="text-xs text-gray-400 mt-1.5 px-1">
                  {filtered.length} / {total} {t('grades.studentsCount', '{{count}} student(s)', { count: total })}
                </p>
              )}
            </div>
          )}

          {/* Students list */}
          {filtered.length === 0 && (
            <p className="px-4 py-4 text-sm text-gray-400 italic text-center">
              {search ? 'No students match your search.' : t('grades.noStudentsEnrolled', 'No students enrolled yet.')}
            </p>
          )}
          {filtered.map(s => (
            <GradeRow
              key={s.studentId}
              student={s}
              subjectId={subj.subjectId}
              type={subj.type}
              onSaved={onSaved}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function TrainerGrades() {
  const { t } = useTranslation();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  function load() {
    trainerApi.getStudentsForGrading()
      .then(r => { setSubjects(r.data || []); setLoading(false); })
      .catch(() => setError(t('common.failedLoad', 'Failed to load data')));
  }
  useEffect(load, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const courses  = subjects.filter(s => s.type === 'course');
  const certs    = subjects.filter(s => s.type === 'certification');

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('grades.title', 'Grade Entry')}</h1>
        <p className="page-subtitle">{t('grades.subtitle', 'Click a course to expand it and enter grades')}</p>
      </div>

      {subjects.length === 0 && (
        <div className="card p-10 text-center">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">{t('grades.noCoursesAssigned', 'No courses or certifications assigned yet.')}</p>
          <p className="text-sm text-gray-400 mt-1">Ask your administrator to assign you courses.</p>
        </div>
      )}

      {/* Academic courses section */}
      {courses.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <BookOpen size={13} className="text-amber-500"/>
            {t('grades.academicCourses', 'Academic Courses')}
            <span className="ml-1 bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold normal-case">
              {courses.length}
            </span>
          </h2>
          {courses.map(subj => (
            <SubjectCard
              key={`${subj.type}-${subj.subjectId}`}
              subj={subj}
              onSaved={load}
            />
          ))}
        </div>
      )}

      {/* Certifications section */}
      {certs.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <Award size={13} className="text-violet-500"/>
            {t('grades.certificationGrades', 'Certifications')}
            <span className="ml-1 bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-semibold normal-case">
              {certs.length}
            </span>
          </h2>
          {certs.map(subj => (
            <SubjectCard
              key={`${subj.type}-${subj.subjectId}`}
              subj={subj}
              onSaved={load}
            />
          ))}
        </div>
      )}
    </div>
  );
}