import { useEffect, useState } from 'react';
import { BarChart2 } from 'lucide-react';
import { parentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

function GradePill({ letter, value }) {
  const n = parseFloat(value);
  let cls = 'bg-green-100 text-green-700';
  if (n < 50)  cls = 'bg-red-100 text-red-700';
  else if (n < 70) cls = 'bg-yellow-100 text-yellow-700';
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${cls}`}>
      {letter || '—'}
    </div>
  );
}

export default function ParentGrades() {
  const { t } = useTranslation();
  const [children, setChildren] = useState([]);
  const [childId, setChildId]   = useState('');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    parentApi.getChildren()
      .then(r => {
        setChildren(r.data || []);
        if (r.data?.length > 0) setChildId(String(r.data[0].id));
        setLoading(false);
      })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }, []);

  useEffect(() => {
    if (!childId) return;
    parentApi.getChildGrades(childId)
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad','Failed to load grades')));
  }, [childId]);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const grades     = data?.grades || [];
  const child      = data?.child  || children.find(c => String(c.id) === String(childId));
  const academic   = grades.filter(g => g.courseId);
  const certGrades = grades.filter(g => g.certificationId);
  const passed = grades.filter(g => parseFloat(g.grade) >= 50).length;
  const failed  = grades.filter(g => parseFloat(g.grade) <  50).length;
  const avg     = grades.length
    ? (grades.reduce((s,g) => s + parseFloat(g.grade||0), 0) / grades.length).toFixed(1)
    : null;

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('grades.parentGradesTitle',"Child's Grades")}</h1>
          {child && <p className="page-subtitle">{child.user?.fullName} · {child.matricule}</p>}
        </div>
        {children.length > 1 && (
          <div>
            <label className="label">{t('grades.selectChild','Select Child')}</label>
            <select className="select w-48" value={childId} onChange={e => setChildId(e.target.value)}>
              {children.map(c => <option key={c.id} value={c.id}>{c.user?.fullName}</option>)}
            </select>
          </div>
        )}
      </div>

      {grades.length === 0 && (
        <div className="card p-10 text-center">
          <BarChart2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">{t('grades.noGradesYet','No grades recorded for this student yet.')}</p>
        </div>
      )}

      {grades.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-primary-600">{avg || '—'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('grades.overall','Average')}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-green-600">{passed}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('grades.passed','Passed')}</p>
            </div>
            <div className="card p-3 text-center">
              <p className="text-xl font-bold text-red-500">{failed}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t('grades.failed','Failed')}</p>
            </div>
          </div>

          {academic.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
                <h2 className="font-semibold text-gray-900 text-sm">{t('grades.academicCourses','Academic Courses')}</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {academic.map(g => (
                  <div key={g.id} className="px-4 py-3 flex items-center gap-3">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{g.course?.name}</p>
                      <p className="text-xs text-gray-400">{g.course?.code}{g.academicYear?.name && ` · ${g.academicYear.name}`}</p>
                    </div>
                    <span className="text-sm font-bold text-gray-700 flex-shrink-0">{g.grade}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certGrades.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-violet-100 bg-violet-50">
                <h2 className="font-semibold text-violet-900 text-sm">{t('grades.certificationGrades','Certifications')}</h2>
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
    </div>
  );
}
