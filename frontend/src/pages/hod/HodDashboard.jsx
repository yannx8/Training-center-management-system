import { useEffect, useState } from 'react';
import { Users, CalendarRange, Clock, BarChart2 } from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, ErrorAlert, StatCard } from '../../components/ui';
import AnnouncementBanner from '../../components/ui/AnnouncementBanner';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function HodDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    hodApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad', 'Failed to load dashboard')));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { stats, programs, recentAnnouncements } = data || {};
  const firstName = user?.fullName?.split(' ')[0] || 'HOD';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{data.department}</h1>
        <p className="page-subtitle">
          {t('auth.welcome', 'Welcome back')}, <span className="font-semibold">{firstName}</span>
        </p>
      </div>

      {/* Announcement banner */}
      {recentAnnouncements?.length > 0 && (
        <AnnouncementBanner announcements={recentAnnouncements} accentColor="teal" />
      )}

      {/* Stats grid — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          label={t('dashboard.programs', 'Programs')}
          value={stats?.programCount ?? '—'}
          icon={<BarChart2 size={20}/>}
          color="bg-teal-100 text-teal-700"
        />
        <StatCard
          label={t('dashboard.trainers', 'Trainers')}
          value={stats?.trainerCount ?? '—'}
          icon={<Users size={20}/>}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          label={t('dashboard.activeWeek', 'Active Week')}
          value={stats?.activeWeek ?? '—'}
          icon={<CalendarRange size={20}/>}
          color="bg-violet-100 text-violet-700"
        />
      </div>

      {/* Programs overview */}
      {programs?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <BarChart2 size={15} className="text-teal-500 flex-shrink-0"/>
            <h2 className="font-semibold text-gray-900 text-sm">{t('dashboard.programsOverview', 'Programs Overview')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {programs.map(p => (
              <div key={p.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.code}</p>
                </div>
                {p.capacity && (
                  <span className="text-xs text-gray-500 flex-shrink-0 bg-gray-100 px-2 py-1 rounded-lg">
                    {t('dashboard.enrolledCapacity', '{{count}}/{{capacity}} enrolled', {
                      count: p._count?.enrollments || 0,
                      capacity: p.capacity,
                    })}
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
