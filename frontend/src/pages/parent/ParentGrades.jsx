import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart2 } from 'lucide-react';
import { parentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

function GradePill({ letter, value }) {
  if (value === null || value === undefined) {
    return (
      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 bg-gray-100 text-gray-400">
        —
      </div>
    );
  }
  const n = parseFloat(value);
  let cls = 'bg-green-100 text-green-700';
  if (n < 50) cls = 'bg-red-100 text-red-700';
  else if (n < 70) cls = 'bg-yellow-100 text-yellow-700';
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${cls}`}>
      {letter || '—'}
    </div>
  );
}

export default function ParentGrades() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [childId, setChildId] = useState(searchParams.get('childId') || '');
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [gradesLoading, setGradesLoading] = useState(false);
  const [error, setError] = useState('');
  const [semFilter, setSemFilter] = useState('');   // ← semester filter

  useEffect(() => {
    parentApi.getChildren().then(r => {
      const kids = r.data || [];
      setChildren(kids);
      if (!childId && kids.length > 0) setChildId(String(kids[0].id));
      setLoading(false);
    }).catch(() => setError(t('common.failedLoad', 'Failed to load children')));
  }, []);

  useEffect(() => {
    if (!childId) { setGrades([]); setSemFilter(''); return; }
    setGradesLoading(true);
    setSemFilter(''); // reset filter when switching child
    parentApi.getChildGrades(childId)
      .then(r => {
        const data = r.data;
        setGrades(Array.isArray(data) ? data : (data?.grades || []));
        setGradesLoading(false);
      })
      .catch(() => { setGrades([]); setGradesLoading(false); });
  }, [childId]);

  const child = children.find(c => String(c.id) === String(childId));
  const academic = grades.filter(g => g.courseId);
  const certGrades = grades.filter(g => g.certificationId);

  // Build semester list from academic grades (same as StudentGrades)
  const semesters = [...new Set(
    academic.map(g => g.course?.session?.semester?.name).filter(Boolean)
  )];

  const filteredAcademic = semFilter
    ? academic.filter(g => g.course?.session?.semester?.name === semFilter)
    : academic;

  // Stats on graded items only
  const gradedItems = grades.filter(g => g.grade !== null);
  const numericGrades = gradedItems.map(g => parseFloat(g.grade));
  const avg = numericGrades.length ? (numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length).toFixed(1) : null;
  const passed = numericGrades.filter(n => n >= 50).length;
  const failed = numericGrades.filter(n => n < 50).length;

  if (loading) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('grades.parentGradesTitle', "Child's Grades")}</h1>
        {child && <p className="page-subtitle">{child.user?.fullName} · {child.matricule}</p>}
      </div>

      {/* Child selector */}
      {children.length > 1 && (
        <div>
          <label className="label">{t('grades.selectChild', 'Select Child')}</label>
          <select className="select" value={childId} onChange={e => setChildId(e.target.value)}>
            {children.map(c => (
              <option key={c.id} value={c.id}>{c.user?.fullName} · {c.matricule}</option>
            ))}
          </select>
        </div>
      )}

      {gradesLoading && <PageLoader />}

      {!gradesLoading && childId && grades.length === 0 && (
        <div className="card p-10 text-center">
          <BarChart2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('grades.noGradesYet', 'No grades recorded yet.')}</p>
        </div>
      )}

      {!gradesLoading && grades.length > 0 && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-primary-600">{avg || '—'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('grades.overall', 'Average')}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-green-600">{passed}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('grades.passed', 'Passed')}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-red-500">{failed}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('grades.failed', 'Failed')}</p>
            </div>
          </div>

          {/* Academic courses — with semester filter */}
          {academic.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-3 flex-wrap">
                <h2 className="font-semibold text-gray-900 text-sm flex-1">
                  {t('grades.academicCourses', 'Academic Courses')}
                </h2>
                {semesters.length > 0 && (
                  <select
                    className="select text-xs py-1.5 w-44"
                    value={semFilter}
                    onChange={e => setSemFilter(e.target.value)}
                  >
                    <option value="">{t('grades.allSemesters', 'All Semesters')}</option>
                    {semesters.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                )}
              </div>
              <div className="divide-y divide-gray-50">
                {filteredAcademic.map(g => (
                  <div key={g.id} className="px-4 py-3 flex items-center gap-3">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{g.course?.name}</p>
                      <p className="text-xs text-gray-400">
                        {g.course?.code}
                        {g.course?.session?.semester?.name && ` · ${g.course.session.semester.name}`}
                        {g.academicYear?.name && ` · ${g.academicYear.name}`}
                      </p>
                    </div>
                    {g.grade !== null ? (
                      <span className="text-sm font-bold text-gray-700 flex-shrink-0">{g.grade}%</span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider flex-shrink-0">
                        {t('grades.pending', 'Pending')}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certification grades */}
          {certGrades.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-violet-100 bg-violet-50">
                <h2 className="font-semibold text-violet-900 text-sm">
                  {t('grades.certificationGrades', 'Certifications')}
                </h2>
              </div>
              <div className="divide-y divide-gray-50">
                {certGrades.map(g => (
                  <div key={g.id} className="px-4 py-3 flex items-center gap-3">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{g.certification?.name}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0">{g.grade}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {!childId && (
        <div className="card p-10 text-center text-gray-400">
          <p>{t('grades.selectChild', 'Select a child to view their grades')}</p>
        </div>
      )}
    </div>
  );
}
