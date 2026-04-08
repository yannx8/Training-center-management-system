import { Calendar, Clock, MapPin, User, BookOpen, Award } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const DAYS_EN = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const TYPE_STYLES = {
  academic: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-900', badge: 'bg-blue-100 text-blue-700', icon: <BookOpen size={12} /> },
  certification: { bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-900', badge: 'bg-violet-100 text-violet-700', icon: <Award size={12} /> },
  default: { bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-900', badge: 'bg-gray-100 text-gray-700', icon: <Calendar size={12} /> },
};

export function SessionCard({ session, type = 'academic' }) {
  const { t } = useTranslation();
  const style = TYPE_STYLES[type] || TYPE_STYLES.default;
  const timeStr = `${session.timeStart?.slice(0, 5) || '—'} – ${session.timeEnd?.slice(0, 5) || '—'}`;
  const subject = session.subject || session.course?.name || session.certification?.name || '—';
  const typeLabel = type === 'certification'
    ? t('timetable.certification', 'Certification')
    : t('timetable.course', 'Course');

  return (
    <div className={`rounded-xl border ${style.border} ${style.bg} p-3 space-y-1.5`}>
      {/* Subject + type badge */}
      <div className="flex items-start justify-between gap-2">
        <p className={`font-semibold text-sm leading-tight flex-1 min-w-0 ${style.text}`}>{subject}</p>
        <span className={`flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap flex-shrink-0 ${style.badge}`}>
          {style.icon} {typeLabel}
        </span>
      </div>

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs text-gray-700">
        <Clock size={12} className="text-gray-400 flex-shrink-0" />
        <span className="font-mono font-semibold">{timeStr}</span>
      </div>

      {/* Room */}
      {(session.room?.name || session.roomName) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <MapPin size={12} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{session.room?.name || session.roomName}</span>
        </div>
      )}

      {/* Trainer */}
      {(session.trainer?.user?.fullName || session.trainerName) && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <User size={12} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{session.trainer?.user?.fullName || session.trainerName}</span>
        </div>
      )}

      {/* Week / level / semester badge row */}
      {(session.weekLabel || session.levelName || session.semesterName) && (
        <div className="flex flex-wrap gap-1 mt-1">
          {session.weekLabel && <span className="text-[10px] bg-white/80 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">{session.weekLabel}</span>}
          {session.levelName && <span className="text-[10px] bg-white/80 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">{session.levelName}</span>}
          {session.semesterName && <span className="text-[10px] bg-white/80 border border-gray-200 rounded px-1.5 py-0.5 text-gray-500">{session.semesterName}</span>}
        </div>
      )}
    </div>
  );
}

export default function TimetableGrid({ sessions = [], getDay, getType, emptyMessage }) {
  const { t } = useTranslation();
  const empty = emptyMessage || t('timetable.noTimetableYet', 'No sessions scheduled yet.');

  if (sessions.length === 0) {
    return (
      <div className="card p-10 text-center">
        <Calendar size={36} className="mx-auto text-gray-300 mb-3" />
        <p className="text-gray-500 font-medium">{empty}</p>
        <p className="text-sm text-gray-400 mt-1">{t('timetable.noTimetableYetHint', 'Your timetable will appear here once it is published.')}</p>
      </div>
    );
  }

  // Group by day
  const byDay = {};
  for (const day of DAYS_EN) {
    byDay[day] = sessions
      .filter(s => (getDay ? getDay(s) : s.dayOfWeek) === day)
      .sort((a, b) => (a.timeStart || '').localeCompare(b.timeStart || ''));
  }

  const activeDays = DAYS_EN.filter(d => byDay[d].length > 0);
  const inactiveDays = DAYS_EN.filter(d => !activeDays.includes(d));

  return (
    <div className="space-y-3">
      {activeDays.map(day => {
        const dayLabel = t(`days.${day}`, day);
        const count = byDay[day].length;
        const countLabel = t(`timetable.sessionCount${count > 1 ? '_plural' : ''}`, `{{count}} session${count > 1 ? 's' : ''}`, { count });

        return (
          <div key={day} className="card overflow-hidden">
            {/* Day header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
              <Calendar size={14} className="text-primary-500 flex-shrink-0" />
              <h3 className="font-bold text-sm text-gray-800">{dayLabel}</h3>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{countLabel}</span>
            </div>
            {/* Session cards — responsive grid */}
            <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {byDay[day].map((s, i) => (
                <SessionCard
                  key={s.id || i}
                  session={s}
                  type={getType ? getType(s) : (s.type || 'academic')}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Inactive days footnote */}
      {inactiveDays.length > 0 && (
        <p className="text-xs text-gray-400 text-center py-1">
          {t('timetable.noSessionsOnDay', 'No sessions on:')} {inactiveDays.map(d => t(`days.${d}`, d)).join(', ')}
        </p>
      )}
    </div>
  );
}
