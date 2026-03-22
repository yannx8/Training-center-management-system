import { useEffect, useState } from 'react';
import { CalendarDays, BarChart2 } from 'lucide-react';
import { studentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import AnnouncementBanner from '../../components/ui/AnnouncementBanner';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData]                   = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [error, setError]                 = useState('');

  useEffect(() => {
    studentApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad','Failed to load dashboard')));
    studentApi.getAnnouncements()
      .then(r => setAnnouncements((r.data||[]).slice(0,5)))
      .catch(() => {});
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { student, recentGrades, upcomingSlots } = data || {};
  const firstName = user?.fullName?.split(' ')[0] || 'Student';

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t('dashboard.studentTitle','Welcome, {{name}}!', { name: firstName })}</h1>
        <p className="page-subtitle">
          {student?.program?.name ? `${student.program.name} · ` : ''}
          {student?.matricule || ''}
        </p>
      </div>

      {/* Announcement banner */}
      <AnnouncementBanner announcements={announcements} accentColor="blue" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Upcoming sessions */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500 flex-shrink-0" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('dashboard.upcomingSessions','Upcoming Sessions')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingSlots?.slice(0,5).map(s => (
              <div key={s.id} className="px-4 py-3">
                <p className="text-sm font-medium text-gray-800 truncate">{s.course?.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {s.dayOfWeek} · {s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)}
                  {s.room?.name ? ` · ${s.room.name}` : ''}
                </p>
              </div>
            ))}
            {!upcomingSlots?.length && (
              <p className="px-4 py-4 text-sm text-gray-400">{t('dashboard.noSessionsYet','No sessions scheduled yet.')}</p>
            )}
          </div>
        </div>

        {/* Recent grades */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
            <BarChart2 size={16} className="text-green-500 flex-shrink-0" />
            <h2 className="font-semibold text-gray-900 text-sm">{t('dashboard.recentGrades','Recent Grades')}</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentGrades?.slice(0,5).map(g => (
              <div key={g.id} className="px-4 py-3 flex items-center justify-between gap-2">
                <p className="text-sm text-gray-700 truncate">{g.course?.name || g.certification?.name}</p>
                <span className={`font-bold text-base flex-shrink-0 ${+g.grade >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                  {g.gradeLetter || '—'}
                </span>
              </div>
            ))}
            {!recentGrades?.length && (
              <p className="px-4 py-4 text-sm text-gray-400">{t('dashboard.noGradesYet','No grades recorded yet.')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
