import { useEffect, useState } from 'react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import TimetableGrid from '../../components/ui/TimetableGrid';
import { useTranslation } from 'react-i18next';

export default function TrainerTimetable() {
  const { t } = useTranslation();
  const [slots, setSlots]     = useState({ academicSlots: [], certSlots: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    trainerApi.getTimetable()
      .then(r => { setSlots(r.data); setLoading(false); })
      .catch(() => setError(t('common.failedLoad', 'Failed to load timetable')));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const allSessions = [
    ...(slots.academicSlots || []).map(s => ({
      ...s,
      type:      'academic',
      subject:   s.course?.name,
      weekLabel: s.timetable?.academicWeek?.label,
      levelName: s.course?.session?.academicLevel?.name,
      semesterName: s.course?.session?.semester?.name,
    })),
    ...(slots.certSlots || []).map(s => ({
      ...s,
      type:      'certification',
      subject:   s.certification?.name,
      weekLabel: s.academicWeek?.label,
    })),
  ];

  const totalAcademic = (slots.academicSlots || []).length;
  const totalCert     = (slots.certSlots || []).length;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">{t('timetable.myTimetableTitle', 'My Timetable')}</h1>
          <p className="page-subtitle">{t('timetable.myTimetableSubtitle', 'All scheduled sessions')}</p>
        </div>
        {allSessions.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
              {totalAcademic} {t('timetable.academic','Academic')}
            </span>
            <span className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1 text-xs font-semibold">
              {totalCert} {t('timetable.certification','Certification')}
            </span>
          </div>
        )}
      </div>

      <TimetableGrid
        sessions={allSessions}
        getDay={s => s.dayOfWeek}
        getType={s => s.type}
      />
    </div>
  );
}
