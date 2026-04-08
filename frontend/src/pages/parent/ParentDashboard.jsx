import { useEffect, useState } from 'react';
import { Users, MessageSquare, BarChart2, Megaphone } from 'lucide-react';
import { parentApi } from '../../api';
import { PageLoader, ErrorAlert, StatCard } from '../../components/ui';
import AnnouncementBanner from '../../components/ui/AnnouncementBanner';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function ParentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    parentApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad', 'Failed to load dashboard')));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { children = [], latestAnnouncements = [], pendingComplaints = 0 } = data || {};
  const firstName = user?.fullName?.split(' ')[0] || t('roles.parent', 'Parent');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t('dashboard.parentTitle', 'Parent Dashboard')}</h1>
        <p className="page-subtitle">
          {t('auth.welcome', 'Welcome back')}, <span className="font-semibold">{firstName}</span>
        </p>
      </div>

      {/* Announcement banner */}
      {latestAnnouncements.length > 0 && (
        <AnnouncementBanner announcements={latestAnnouncements} accentColor="pink" />
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label={t('parentChildren.title', 'My Children')}
          value={children.length}
          icon={<Users size={20} />}
          color="bg-pink-100 text-pink-700"
        />
        <StatCard
          label={t('dashboard.pendingComplaints', 'Pending Complaints')}
          value={pendingComplaints}
          icon={<MessageSquare size={20} />}
          color="bg-red-100 text-red-600"
        />
      </div>

      {/* Children overview */}
      {children.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <Users size={15} className="text-pink-500 flex-shrink-0" />
            <h2 className="font-semibold text-gray-900 text-sm">
              {t('parentChildren.title', 'My Children')}
            </h2>
          </div>
          <div className="divide-y divide-gray-50">
            {children.map(c => (
              <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-pink-100 flex items-center justify-center flex-shrink-0 text-pink-700 text-sm font-bold">
                  {c.user?.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{c.user?.fullName}</p>
                  <p className="text-xs text-gray-400">{c.matricule} · {c.program?.name || t('parentChildren.noProgram', 'No program')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {children.length === 0 && (
        <div className="card p-10 text-center">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('parentChildren.noChildren', 'No children linked')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('parentChildren.noChildrenHint', 'Contact the secretary to link your children to your account.')}</p>
        </div>
      )}
    </div>
  );
}
