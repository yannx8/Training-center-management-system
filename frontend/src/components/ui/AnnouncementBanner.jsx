/**
 * AnnouncementBanner
 * Dismissible latest-announcements panel — fully translated, mobile-friendly.
 * Props:
 *   announcements: array   — from API
 *   accentColor: string    — 'amber' | 'blue' | 'pink' | 'teal'
 */
import { useState } from 'react';
import { Megaphone, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ACCENT = {
  amber: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', iconBg: 'bg-amber-100', title: 'text-amber-900', badge: 'bg-amber-200 text-amber-800', btn: 'text-amber-500 hover:text-amber-700' },
  blue:  { bg: 'bg-blue-50',  border: 'border-blue-200',  icon: 'text-blue-600',  iconBg: 'bg-blue-100',  title: 'text-blue-900',  badge: 'bg-blue-200 text-blue-800',  btn: 'text-blue-500 hover:text-blue-700' },
  pink:  { bg: 'bg-pink-50',  border: 'border-pink-200',  icon: 'text-pink-600',  iconBg: 'bg-pink-100',  title: 'text-pink-900',  badge: 'bg-pink-200 text-pink-800',  btn: 'text-pink-500 hover:text-pink-700' },
  teal:  { bg: 'bg-teal-50',  border: 'border-teal-200',  icon: 'text-teal-600',  iconBg: 'bg-teal-100',  title: 'text-teal-900',  badge: 'bg-teal-200 text-teal-800',  btn: 'text-teal-500 hover:text-teal-700' },
  violet:{ bg: 'bg-violet-50',border: 'border-violet-200',icon: 'text-violet-600',iconBg: 'bg-violet-100',title: 'text-violet-900',badge: 'bg-violet-200 text-violet-800',btn: 'text-violet-500 hover:text-violet-700' },
};

export default function AnnouncementBanner({ announcements = [], accentColor = 'blue' }) {
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);
  const [expanded, setExpanded]   = useState(false);

  if (dismissed || announcements.length === 0) return null;

  const c       = ACCENT[accentColor] || ACCENT.blue;
  const preview = announcements[0];
  const rest    = announcements.slice(1);

  return (
    <div className={`rounded-xl border ${c.bg} ${c.border} overflow-hidden`}>
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div className={`w-8 h-8 rounded-lg ${c.iconBg} flex items-center justify-center flex-shrink-0`}>
          <Megaphone size={16} className={c.icon} />
        </div>
        <span className={`text-sm font-bold flex-1 min-w-0 truncate ${c.title}`}>
          {t('announcements.latestAnnouncements', 'Latest Announcements')}
          <span className={`ml-2 text-xs font-semibold px-2 py-0.5 rounded-full ${c.badge}`}>
            {announcements.length}
          </span>
        </span>
        {rest.length > 0 && (
          <button
            onClick={() => setExpanded(e => !e)}
            className={`text-xs font-medium flex items-center gap-1 flex-shrink-0 ${c.btn} transition-colors`}
          >
            {expanded
              ? <><ChevronUp size={14}/> {t('announcements.less', 'Less')}</>
              : <><ChevronDown size={14}/> {t('announcements.more', '+{{count}} more', { count: rest.length })}</>}
          </button>
        )}
        <button
          onClick={() => setDismissed(true)}
          className={`${c.btn} transition-colors ml-1 flex-shrink-0`}
          title={t('announcements.dismiss', 'Dismiss')}
        >
          <X size={15} />
        </button>
      </div>

      {/* Announcement items */}
      <div className="px-4 pb-3 space-y-2">
        <AnnouncementItem a={preview} c={c} />
        {expanded && rest.map(a => <AnnouncementItem key={a.id} a={a} c={c} />)}
      </div>
    </div>
  );
}

function AnnouncementItem({ a, c }) {
  const { i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? 'fr-FR' : 'en-GB';
  return (
    <div className="bg-white/60 rounded-lg px-3 py-3 border border-white/80">
      <p className={`text-sm font-semibold leading-snug ${c.title}`}>{a.title}</p>
      <p className="text-xs text-gray-600 mt-0.5 line-clamp-2">{a.body}</p>
      <p className="text-[10px] text-gray-400 mt-1 flex flex-wrap gap-1">
        {a.creator?.fullName && <span>{a.creator.fullName}</span>}
        {a.department?.name  && <><span>·</span><span>{a.department.name}</span></>}
        <span>· {new Date(a.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
      </p>
    </div>
  );
}
