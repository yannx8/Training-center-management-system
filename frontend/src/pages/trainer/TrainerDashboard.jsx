import { useEffect, useState } from 'react';
import { BookOpen, Award, Clock, MessageCircle } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert, StatCard } from '../../components/ui';
import AnnouncementBanner from '../../components/ui/AnnouncementBanner';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function TrainerDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    trainerApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad', 'Failed to load dashboard')));
    trainerApi.getAnnouncements()
      .then(r => setAnnouncements((r.data || []).slice(0, 5)))
      .catch(() => { });
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { stats, recentCourses, activeWeek } = data || {};

  // FIX: Use trainerName from API response first, fall back to auth context user.
  // Prevents "Welcome back, undefined" when the user object in localStorage
  // doesn't have fullName (e.g. created before the firstName/lastName split).
  const displayName = data?.trainerName || user?.fullName || 'Trainer';

  // Hide availability announcement if trainer already submitted for the active week
  const displayAnnouncements = announcements.filter(a => {
    if (activeWeek?.submitted && (
      a.title.includes('Availability submission') ||
      a.body.includes('Submit your availability')
    )) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t('dashboard.trainerTitle', 'Trainer Dashboard')}</h1>
        <p className="page-subtitle">
          {t('auth.welcome', 'Welcome back')},{' '}
          <span className="font-semibold text-primary-600">{displayName}</span>
        </p>
      </div>

      {displayAnnouncements.length > 0 && (
        <AnnouncementBanner announcements={displayAnnouncements} accentColor="amber" />
      )}

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t('nav.courses', 'My Courses')}
          value={stats?.courseCount ?? '—'}
          icon={<BookOpen size={20} />}
          color="bg-amber-100 text-amber-700"
        />
        <StatCard
          label={t('nav.certifications', 'Certifications')}
          value={stats?.certCount ?? '—'}
          icon={<Award size={20} />}
          color="bg-violet-100 text-violet-700"
        />
        <StatCard
          label={t('dashboard.weeklySlots', 'Weekly Slots')}
          value={stats?.availabilitySlots ?? '—'}
          icon={<Clock size={20} />}
          color="bg-blue-100 text-blue-700"
        />
        <StatCard
          label={t('dashboard.pendingGradeComplaints', 'Pending Complaints')}
          value={stats?.pendingComplaints ?? '—'}
          icon={<MessageCircle size={20} />}
          color="bg-red-100 text-red-600"
        />
      </div>

      {recentCourses?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <BookOpen size={15} className="text-amber-500 flex-shrink-0" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('nav.courses', 'My Courses')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentCourses.map(c => (
              <div key={c.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900 truncate">{c.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {c.code}
                  {c.session?.program?.name && ` · ${c.session.program.name}`}
                  {c.session?.academicLevel?.name && ` · ${c.session.academicLevel.name}`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}