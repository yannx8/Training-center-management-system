import { useEffect, useState } from 'react';
import { studentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import TimetableGrid from '../../components/ui/TimetableGrid';
import { useTranslation } from 'react-i18next';

export default function StudentTimetable() {
  const { t } = useTranslation();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Only fetch timetable — auto-uses latest published academic week on backend
    studentApi.getTimetable()
      .then(r => { setSlots(r.data || []); setLoading(false); })
      .catch(() => { setError(t('common.failedLoad', 'Failed to load timetable')); setLoading(false); });
  }, []);

  if (loading) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  if (slots.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">{t('timetable.studentTimetableTitle', 'Academic Timetable')}</h1>
          <p className="page-subtitle">{t('timetable.studentTimetableSubtitle', 'Your scheduled class sessions')}</p>
        </div>
        <div className="card p-12 text-center text-gray-400">
          <p className="font-medium">{t('timetable.noTimetableYet', 'No timetable published yet')}</p>
          <p className="text-sm mt-1">{t('timetable.noTimetableYetHint', 'Your timetable will appear here once your HOD generates and publishes it.')}</p>
        </div>
      </div>
    );
  }

  // Get the week label from the first slot for display
  const weekLabel = slots[0]?.timetable?.academicWeek?.label;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">{t('timetable.studentTimetableTitle', 'Academic Timetable')}</h1>
        <p className="page-subtitle">
          {weekLabel
            ? `${t('timetable.activeWeek', 'Active week')}: ${weekLabel}`
            : t('timetable.studentTimetableSubtitle', 'Your scheduled class sessions')}
        </p>
      </div>

      <TimetableGrid
        sessions={slots.map(s => ({
          ...s,
          subject: s.course?.name,
          weekLabel: s.timetable?.academicWeek?.label,
          levelName: s.course?.session?.academicLevel?.name,
          semesterName: s.course?.session?.semester?.name,
        }))}
        getDay={s => s.dayOfWeek}
        getType={() => 'academic'}
        emptyMessage={t('timetable.noTimetableYet', 'No sessions scheduled yet.')}
      />
    </div>
  );
}