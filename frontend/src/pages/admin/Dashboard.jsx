import { useEffect, useState } from 'react';
import { Users, Building2, BookOpen, Award, DoorOpen, MessageCircle, UserPlus } from 'lucide-react';
import { adminApi } from '../../api';
import { PageLoader, ErrorAlert, StatCard, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const [data, setData]   = useState(null);
  const [error, setError] = useState('');
  const locale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-GB';

  useEffect(() => {
    adminApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad', 'Failed to load dashboard')));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { stats, recentUsers } = data || {};

  const STAT_ROWS = [
    { key: 'totalUsers',         label: t('dashboard.totalUsers','Total Users'),         value: stats?.totalUsers,         icon: <Users size={20}/>,    color: 'bg-violet-100 text-violet-700' },
    { key: 'departments',        label: t('dashboard.departments','Departments'),         value: stats?.departments,        icon: <Building2 size={20}/>, color: 'bg-teal-100 text-teal-700' },
    { key: 'programs',           label: t('dashboard.programs','Programs'),               value: stats?.programs,           icon: <BookOpen size={20}/>,  color: 'bg-blue-100 text-blue-700' },
    { key: 'certifications',     label: t('nav.certifications','Certifications'),         value: stats?.certifications,     icon: <Award size={20}/>,     color: 'bg-amber-100 text-amber-700' },
    { key: 'trainers',           label: t('dashboard.trainers','Trainers'),               value: stats?.trainers,           icon: <Users size={20}/>,     color: 'bg-orange-100 text-orange-700' },
    { key: 'students',           label: t('dashboard.students','Students'),               value: stats?.students,           icon: <Users size={20}/>,     color: 'bg-green-100 text-green-700' },
    { key: 'pendingComplaints',  label: t('dashboard.pendingComplaints','Pending Complaints'), value: stats?.pendingComplaints, icon: <MessageCircle size={20}/>, color: 'bg-red-100 text-red-600' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t('dashboard.title','Admin Dashboard')}</h1>
        <p className="page-subtitle">{t('dashboard.subtitle','System overview and recent activity')}</p>
      </div>

      {/* Stats grid — 2 cols mobile, 4 cols lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {STAT_ROWS.map(s => (
          <StatCard
            key={s.key}
            label={s.label}
            value={s.value ?? '—'}
            icon={s.icon}
            color={s.color}
          />
        ))}
      </div>

      {/* Recent users */}
      {recentUsers?.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <UserPlus size={15} className="text-violet-500 flex-shrink-0"/>
            <h2 className="font-semibold text-gray-900 text-sm">{t('dashboard.recentUsers','Recently Added Users')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.slice(0, 8).map(u => (
              <div key={u.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-600">
                  {u.fullName?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{u.fullName}</p>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {u.roles?.map(r => (
                    <span key={r} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full capitalize ${
                      r === 'admin' ? 'bg-violet-100 text-violet-700' :
                      r === 'hod'   ? 'bg-teal-100 text-teal-700' :
                      r === 'trainer' ? 'bg-amber-100 text-amber-700' :
                      r === 'student' ? 'bg-blue-100 text-blue-700' :
                      r === 'parent'  ? 'bg-pink-100 text-pink-700' :
                      'bg-cyan-100 text-cyan-700'
                    }`}>
                      {t(`roles.${r}`, r)}
                    </span>
                  ))}
                  <Badge value={u.status}/>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}