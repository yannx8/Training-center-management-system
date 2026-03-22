import { useEffect, useState } from 'react';
import { Users, UserPlus, BookOpen, Award } from 'lucide-react';
import { secretaryApi } from '../../api';
import { PageLoader, ErrorAlert, StatCard } from '../../components/ui';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function SecretaryDashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    secretaryApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad','Failed to load dashboard')));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { activeYear, programs = [], certifications = [], studentCount = 0 } = data || {};

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t('secretary.dashboardTitle','Secretary Dashboard')}</h1>
        {activeYear && (
          <p className="page-subtitle">{t('secretary.activeYear','Active Academic Year: {{name}}', { name: activeYear.name })}</p>
        )}
      </div>

      {/* Quick action buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/secretary/register')}
          className="card p-4 flex flex-col items-center gap-2 hover:bg-primary-50 hover:border-primary-200 transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center">
            <UserPlus size={24} className="text-primary-600"/>
          </div>
          <p className="text-sm font-semibold text-gray-900">{t('secretary.registerTitle','Register Student')}</p>
          <p className="text-xs text-gray-400 text-center">{t('secretary.registerSubtitle','Create a new student account')}</p>
        </button>
        <button
          onClick={() => navigate('/secretary/students')}
          className="card p-4 flex flex-col items-center gap-2 hover:bg-cyan-50 hover:border-cyan-200 transition-all active:scale-[0.98] cursor-pointer"
        >
          <div className="w-12 h-12 bg-cyan-100 rounded-2xl flex items-center justify-center">
            <Users size={24} className="text-cyan-600"/>
          </div>
          <p className="text-sm font-semibold text-gray-900">{t('secretary.allStudentsTitle','All Students')}</p>
          <p className="text-xs text-gray-400 text-center">{studentCount} {t('secretary.enrolled','enrolled')}</p>
        </button>
      </div>

      {/* Active Programs */}
      {programs.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <BookOpen size={15} className="text-primary-500"/>
            <h2 className="font-semibold text-gray-900 text-sm">{t('secretary.activePrograms','Active Programs')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {programs.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.code} · {p.department?.name}</p>
                </div>
                {p.capacity && (
                  <span className="text-xs text-gray-500 flex-shrink-0 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {t('secretary.enrolledCapacity','{{count}}/{{capacity}} enrolled', { count: p._count?.enrollments||0, capacity: p.capacity })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {programs.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          <p>{t('secretary.noProgramsAvailable','No active programs available.')}</p>
        </div>
      )}

      {/* Active Certifications */}
      {certifications.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Award size={15} className="text-violet-500"/>
            <h2 className="font-semibold text-gray-900 text-sm">{t('secretary.activeCertifications','Active Certifications')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {certifications.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.code} · {c.durationHours}h</p>
                </div>
                {c.capacity && (
                  <span className="text-xs text-gray-500 flex-shrink-0 bg-gray-100 px-2 py-0.5 rounded-lg">
                    {t('secretary.enrolledCapacity','{{count}}/{{capacity}} enrolled', { count: c._count?.enrollments||0, capacity: c.capacity })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}