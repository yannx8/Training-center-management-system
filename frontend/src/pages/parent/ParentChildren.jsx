import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, CalendarDays, BarChart2 } from 'lucide-react';
import { parentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function ParentChildren() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [children, setChildren] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    parentApi.getChildren()
      .then(r => { setChildren(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load children')));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const count = children.length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('parentChildren.title','My Children')}</h1>
        <p className="page-subtitle">
          {count === 1
            ? t('parentChildren.subtitle','{{count}} child linked to your account', { count })
            : t('parentChildren.subtitle_plural','{{count}} children linked to your account', { count })
          }
        </p>
      </div>

      {children.length === 0 && (
        <div className="card p-10 text-center">
          <Users size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">{t('parentChildren.noChildren','No children linked')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('parentChildren.noChildrenHint','Contact the secretary to link your children to your account.')}</p>
        </div>
      )}

      <div className="space-y-3">
        {children.map(c => (
          <div key={c.id} className="card p-4">
            {/* Child info */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-pink-100 flex items-center justify-center flex-shrink-0 text-pink-700 text-lg font-bold">
                {c.user?.fullName?.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{c.user?.fullName}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.matricule}
                  {c.program?.name && ` · ${c.program.name}`}
                  {c.program?.department?.name && ` · ${c.program.department.name}`}
                </p>
              </div>
            </div>

            {/* Quick-action buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 active:scale-[0.98] transition-all"
                onClick={() => navigate(`/parent/timetable?childId=${c.id}`)}
              >
                <CalendarDays size={16}/>
                {t('parentChildren.viewTimetable','Timetable')}
              </button>
              <button
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100 active:scale-[0.98] transition-all"
                onClick={() => navigate(`/parent/grades?childId=${c.id}`)}
              >
                <BarChart2 size={16}/>
                {t('parentChildren.viewGrades','Grades')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
