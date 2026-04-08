import { useEffect, useState } from "react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";
import TimetableGrid from "../../components/ui/TimetableGrid";
import { useTranslation } from "react-i18next";

export default function StudentTimetable() {
  const { t } = useTranslation();
  const [slots, setSlots]       = useState([]);
  const [weeks, setWeeks]       = useState([]);
  const [weekId, setWeekId]     = useState("");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    Promise.all([
      studentApi.getTimetable(),
      studentApi.getPublishedWeeks ? studentApi.getPublishedWeeks() : Promise.resolve({ data: [] }),
    ]).then(([t, w]) => {
      setSlots(t.data || []);
      setWeeks(w.data || []);
      setLoading(false);
    }).catch(() => setError("Failed to load timetable"));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const filtered = weekId ? slots.filter(s => String(s.timetable?.academicWeek?.id) === String(weekId) || String(s.academicWeekId) === String(weekId)) : slots;

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

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="page-title">{t('timetable.studentTimetableTitle', 'Academic Timetable')}</h1>
          <p className="page-subtitle">{t('timetable.studentTimetableSubtitle', 'Your scheduled class sessions')}</p>
        </div>
        {/* Week filter */}
        {weeks.length > 0 && (
          <div>
            <label className="label">{t('timetable.filterByWeek', 'Filter by Week')}</label>
            <select className="select w-52" value={weekId} onChange={e => setWeekId(e.target.value)}>
              <option value="">{t('timetable.allPublishedWeeks', 'All published weeks')}</option>
              {weeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
        )}
      </div>

      <TimetableGrid
        sessions={filtered.map(s => ({
          ...s,
          subject: s.course?.name,
        }))}
        getDay={s => s.dayOfWeek}
        getType={() => 'academic'}
        emptyMessage={t('timetable.noTimetableYet', 'No sessions scheduled yet.')}
      />
    </div>
  );
}
