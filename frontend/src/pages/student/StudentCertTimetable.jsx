import { useEffect, useState } from 'react';
import { Award } from 'lucide-react';
import { studentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import TimetableGrid from '../../components/ui/TimetableGrid';
import { useTranslation } from 'react-i18next';

export default function StudentCertTimetable() {
  const { t } = useTranslation();
  const [slots, setSlots]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    studentApi.getCertTimetable()
      .then(r => { setSlots(r.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load certification timetable')));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  if (slots.length === 0) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="page-title">{t('timetable.certTimetableTitle','Certification Timetable')}</h1>
          <p className="page-subtitle">{t('timetable.certTimetableSubtitle','Your scheduled certification sessions')}</p>
        </div>
        <div className="card p-10 text-center">
          <Award size={36} className="mx-auto text-gray-300 mb-3"/>
          <p className="text-gray-500 font-medium">{t('timetable.noTimetableYet','No certification sessions scheduled')}</p>
          <p className="text-sm text-gray-400 mt-1">{t('timetable.certNoSessionHint','Submit your availability in the Cert Availability tab so your trainer can generate your schedule.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('timetable.certTimetableTitle','Certification Timetable')}</h1>
        <p className="page-subtitle">{t('timetable.certTimetableSubtitle','Your scheduled certification sessions')}</p>
      </div>

      <TimetableGrid
        sessions={slots.map(s => ({
          ...s,
          subject:   s.certification?.name,
          weekLabel: s.academicWeek?.label,
        }))}
        getDay={s => s.dayOfWeek}
        getType={() => 'certification'}
        emptyMessage={t('timetable.noTimetableYet','No sessions scheduled yet.')}
      />
    </div>
  );
}
