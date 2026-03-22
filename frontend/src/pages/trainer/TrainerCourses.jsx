import { useEffect, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function TrainerCourses() {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    trainerApi.getCourses()
      .then(r => { setCourses(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load courses')));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('trainerCourses.title','My Courses')}</h1>
        <p className="page-subtitle">{t('trainerCourses.subtitle','Academic courses assigned to you')}</p>
      </div>

      {courses.length === 0 && (
        <div className="card p-10 text-center">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500">{t('trainerCourses.noCourses','No courses assigned to you yet.')}</p>
        </div>
      )}

      <div className="space-y-2">
        {courses.map(c => (
          <div key={c.id} className="card px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <BookOpen size={16} className="text-amber-600"/>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{c.code}</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {c.session?.program?.name && (
                    <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 rounded-lg px-2 py-0.5">
                      {c.session.program.name}
                    </span>
                  )}
                  {c.session?.academicLevel?.name && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-0.5">
                      {c.session.academicLevel.name}
                    </span>
                  )}
                  {c.session?.semester?.name && (
                    <span className="text-xs bg-gray-100 text-gray-600 rounded-lg px-2 py-0.5">
                      {c.session.semester.name}
                    </span>
                  )}
                  <span className="text-xs bg-amber-50 text-amber-700 border border-amber-100 rounded-lg px-2 py-0.5">
                    {c.credits} {t('trainerCourses.credits','cr')} · {c.hoursPerWeek}h/{t('trainerCourses.hoursPerWeek','wk')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
