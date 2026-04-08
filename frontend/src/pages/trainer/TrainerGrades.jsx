import { useEffect, useState, useMemo } from 'react';
import { Save, CheckCircle, Search, BookOpen, Award, ArrowLeft, Users } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

//  Score badge 
function ScoreBadge({ value }) {
  const n = parseFloat(value);
  if (!value || isNaN(n)) return null;
  if (n >= 70) return <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">A</span>;
  if (n >= 50) return <span className="text-xs font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">P</span>;
  return <span className="text-xs font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">F</span>;
}

//  Grade row used in detail view 
function GradeRow({ student, subjectId, type, grades, onChange }) {
  const val = grades[student.studentId] ?? (student.existingGrade !== null ? String(student.existingGrade) : '');
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-gray-500">
        {student.fullName?.charAt(0)?.toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{student.fullName}</p>
        <p className="text-xs text-gray-400">{student.matricule}</p>
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        <ScoreBadge value={val} />
        <input
          type="number"
          min="0"
          max="100"
          step="0.5"
          inputMode="decimal"
          className="w-20 px-2 py-1.5 text-center text-sm font-semibold rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
          placeholder="0–100"
          value={val}
          onChange={e => onChange(student.studentId, e.target.value)}
        />
      </div>
    </div>
  );
}

//  Detail view: all students for one subject 
function SubjectDetail({ subj, onBack, onSaved }) {
  const { t } = useTranslation();
  const [grades, setGrades] = useState({});
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedIds, setSavedIds] = useState(new Set(
    subj.students.filter(s => s.existingGrade !== null).map(s => s.studentId)
  ));
  const [error, setError] = useState('');
  const isCourse = subj.type === 'course';

  const filtered = useMemo(() =>
    search.trim()
      ? subj.students.filter(s => s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.matricule?.toLowerCase().includes(search.toLowerCase()))
      : subj.students,
    [search, subj.students]
  );

  function handleChange(studentId, val) {
    setGrades(g => ({ ...g, [studentId]: val }));
    setSavedIds(s => { const n = new Set(s); n.delete(studentId); return n; });
  }

  async function handleSaveAll() {
    setSaving(true); setError('');
    const toSave = subj.students.filter(s => {
      const val = grades[s.studentId] ?? (s.existingGrade !== null ? String(s.existingGrade) : '');
      return val !== '' && !isNaN(parseFloat(val));
    });
    if (!toSave.length) { setSaving(false); return; }
    try {
      await Promise.all(toSave.map(s => {
        const val = grades[s.studentId] ?? String(s.existingGrade);
        return trainerApi.upsertGrade({
          studentId: s.studentId,
          grade: parseFloat(val),
          ...(isCourse ? { courseId: subj.subjectId } : { certificationId: subj.subjectId }),
        });
      }));
      setSavedIds(new Set(toSave.map(s => s.studentId)));
      onSaved();
    } catch (e) {
      setError(e.response?.data?.message || t('common.failedSave', 'Failed to save grades'));
    } finally { setSaving(false); }
  }

  const graded = subj.students.filter(s => {
    const val = grades[s.studentId] ?? (s.existingGrade !== null ? String(s.existingGrade) : '');
    return val !== '';
  }).length;
  const total = subj.students.length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <button className="btn-ghost btn-sm mb-3" onClick={onBack}>
          <ArrowLeft size={15} /> {t('grades.backToList', 'Back to courses')}
        </button>
        <div className="flex items-start gap-3">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${isCourse ? 'bg-amber-100' : 'bg-violet-100'}`}>
            {isCourse
              ? <BookOpen size={20} className="text-amber-600" />
              : <Award size={20} className="text-violet-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="page-title">{subj.subjectName}</h1>
            <p className="page-subtitle">
              {subj.subjectCode}
              {subj.programName && ` · ${subj.programName}`}
              {subj.levelName && ` · ${subj.levelName}`}
              {subj.semesterName && ` · ${subj.semesterName}`}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar: search + save all */}
      <div className="card p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent"
            placeholder={t('grades.searchStudents', 'Search by name or matricule…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="text-xs text-gray-500 font-medium">
            <Users size={13} className="inline mr-1" />
            {graded}/{total} {t('grades.graded', 'graded')}
          </span>
          <button
            className="btn-primary"
            onClick={handleSaveAll}
            disabled={saving}
          >
            {saving ? t('common.saving', 'Saving…') : <><Save size={15} /> {t('grades.saveAll', 'Save All')}</>}
          </button>
        </div>
      </div>

      {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</div>}

      {/* Student list */}
      <div className="card overflow-hidden">
        {filtered.length === 0 && (
          <p className="px-4 py-8 text-sm text-gray-400 text-center">
            {search ? t('grades.noStudentsMatch', 'No students match your search.') : t('grades.noStudentsEnrolled', 'No students enrolled yet.')}
          </p>
        )}
        {filtered.map(s => (
          <div key={s.studentId} className={savedIds.has(s.studentId) ? 'bg-green-50/40' : ''}>
            <GradeRow
              student={s}
              subjectId={subj.subjectId}
              type={subj.type}
              grades={grades}
              onChange={handleChange}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

//  List view: all courses/certs 
function SubjectList({ subjects, onSelect }) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const courses = subjects.filter(s => s.type === 'course');
  const certs = subjects.filter(s => s.type === 'certification');

  const filterSubjects = list =>
    search.trim()
      ? list.filter(s => s.subjectName?.toLowerCase().includes(search.toLowerCase()) || s.subjectCode?.toLowerCase().includes(search.toLowerCase()))
      : list;

  const filteredCourses = filterSubjects(courses);
  const filteredCerts = filterSubjects(certs);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('grades.title', 'Grade Entry')}</h1>
        <p className="page-subtitle">{t('grades.subtitle', 'Select a course or certification to enter grades')}</p>
      </div>

      {/* Search */}
      {subjects.length > 3 && (
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            className="w-full pl-8 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-white"
            placeholder={t('grades.searchCourses', 'Search courses…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      )}

      {subjects.length === 0 && (
        <div className="card p-10 text-center">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('grades.noCoursesAssigned', 'No courses or certifications assigned yet.')}</p>
          <p className="text-sm text-gray-400 mt-1">Ask your administrator to assign you courses.</p>
        </div>
      )}

      {/* Academic courses */}
      {filteredCourses.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <BookOpen size={12} className="text-amber-500" />
            {t('grades.academicCourses', 'Academic Courses')}
            <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full font-semibold normal-case">
              {filteredCourses.length}
            </span>
          </h2>
          {filteredCourses.map(subj => {
            const graded = subj.students.filter(s => s.existingGrade !== null).length;
            const total = subj.students.length;
            return (
              <button
                key={`course-${subj.subjectId}`}
                className="card w-full px-4 py-4 flex items-center gap-3 hover:bg-amber-50 hover:border-amber-200 transition-all text-left active:scale-[0.99]"
                onClick={() => onSelect(subj)}
              >
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{subj.subjectName}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {subj.subjectCode}
                    {subj.programName && ` · ${subj.programName}`}
                    {subj.levelName && ` · ${subj.levelName}`}
                    {subj.semesterName && ` · ${subj.semesterName}`}
                  </p>
                </div>
                <div className="flex-shrink-0 text-right min-w-[80px]">
                  {graded === 0 ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                      {t('grades.notGraded', 'Not Graded')}
                    </span>
                  ) : (
                    <p className="text-xs font-semibold text-gray-700">{graded}/{total}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}

      {/* Certifications */}
      {filteredCerts.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 flex items-center gap-2">
            <Award size={12} className="text-violet-500" />
            {t('grades.certifications', 'Certifications')}
            <span className="bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded-full font-semibold normal-case">
              {filteredCerts.length}
            </span>
          </h2>
          {filteredCerts.map(subj => {
            const graded = subj.students.filter(s => s.existingGrade !== null).length;
            const total = subj.students.length;
            return (
              <button
                key={`cert-${subj.subjectId}`}
                className="card w-full px-4 py-4 flex items-center gap-3 hover:bg-violet-50 hover:border-violet-200 transition-all text-left active:scale-[0.99]"
                onClick={() => onSelect(subj)}
              >
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Award size={18} className="text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{subj.subjectName}</p>
                  <p className="text-xs text-gray-400 truncate">{subj.subjectCode} · {t('grades.certification', 'Certification')}</p>
                </div>
                <div className="flex-shrink-0 text-right min-w-[80px]">
                  {graded === 0 ? (
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-1 rounded-lg uppercase tracking-wider">
                      {t('grades.notGraded', 'Not Graded')}
                    </span>
                  ) : (
                    <p className="text-xs font-semibold text-gray-700">{graded}/{total}</p>
                  )}
                </div>
                <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

//  Main component 
export default function TrainerGrades() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);

  function load() {
    trainerApi.getStudentsForGrading()
      .then(r => { setSubjects(r.data || []); setLoading(false); })
      .catch(() => setError('Failed to load data'));
  }
  useEffect(load, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  if (selected) {
    // Find fresh data for the selected subject after saves
    const fresh = subjects.find(s => s.type === selected.type && s.subjectId === selected.subjectId) || selected;
    return (
      <SubjectDetail
        subj={fresh}
        onBack={() => setSelected(null)}
        onSaved={load}
      />
    );
  }

  return (
    <SubjectList
      subjects={subjects}
      onSelect={setSelected}
    />
  );
}