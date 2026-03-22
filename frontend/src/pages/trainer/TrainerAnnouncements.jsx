import { useEffect, useState } from 'react';
import { Megaphone, Bell } from 'lucide-react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function TrainerAnnouncements() {
  const { t, i18n } = useTranslation();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const locale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-GB';

  useEffect(() => {
    trainerApi.getAnnouncements()
      .then(r => { setAnnouncements(r.data || []); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load announcements')));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('announcements.title','Announcements')}</h1>
        <p className="page-subtitle">{t('announcements.departmentMessagesTrainer','Department announcements for trainers')}</p>
      </div>

      {announcements.length === 0 && (
        <div className="card p-10 text-center">
          <Megaphone size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">{t('announcements.noAnnouncementsYet','No announcements yet.')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('announcements.noMessagesFromHOD','Announcements from your HOD will appear here.')}</p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={16} className="text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900 text-sm">{a.title}</p>
                  {a.department?.name && <span className="badge-purple text-xs">{a.department.name}</span>}
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{a.body}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {a.creator?.fullName} · {new Date(a.createdAt).toLocaleDateString(locale, { day:'numeric', month:'long', year:'numeric' })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
