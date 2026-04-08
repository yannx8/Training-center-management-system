import { useEffect, useState } from 'react';
import { Zap, Send, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, ErrorAlert, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HodTimetable() {
  const { t } = useTranslation();
  const [weeks, setWeeks] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // This loads up the "published" weeks (the ones everyone can see), 
  // the existing timetables, and the list of programs in this HOD's department.
  function load() {
    setLoading(true);
    Promise.all([hodApi.getWeeks(), hodApi.getTimetables(), hodApi.getPrograms()])
      .then(([w, tt, p]) => {
        // Only allow generation for published weeks
        const availableWeeks = (w.data || []).filter(ww => ww.status === 'published');
        setWeeks(availableWeeks);
        setTimetables(tt.data || []);
        setPrograms(p.data || []);
        
        if (availableWeeks.length > 0) {
          const latest = [...availableWeeks].sort((a, b) => b.weekNumber - a.weekNumber)[0];
          setSelectedWeekId(latest.id);
        }
        setLoading(false);
      })
      .catch(() => {
        setError(t('common.failedLoad', 'Failed to load'));
        setLoading(false);
      });
  }
  useEffect(load, []);

  // This triggers the heavy-lifting logic on the backend to automatically
  // assign courses to rooms and trainers without hitting any conflicts.
  async function generate() {
    if (!selectedWeekId) return;
    setGenerating(true); setMsg(''); setError('');
    try {
      const r = await hodApi.generateTimetable({ weekId: selectedWeekId });
      setMsg(t('timetable.generated', 'Generated: {{count}} sessions scheduled ({{skipped}} skipped)', { count: r.data.count, skipped: r.data.skipped }));
      load();
    } catch (e) { setError(e.response?.data?.message || t('timetable.generationFailed', 'Generation failed')); }
    finally { setGenerating(false); }
  }

  // Once the HOD is happy with the draft timetable, they "publish" it
  // so that students and trainers can finally see it on their ends.
  async function publish(id) {
    try {
      await hodApi.publishTimetable(id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to publish');
    }
  }

  if (loading) return <PageLoader />;

  const activeWeek = weeks.find(w => String(w.id) === String(selectedWeekId));

  // Find the published timetable for the active week
  const activeTimetable = timetables.find(tt => tt.status === 'published' && String(tt.academicWeekId) === String(selectedWeekId));

  if (selectedProgramId) {
    const program = programs.find(p => String(p.id) === String(selectedProgramId));
    // Filter slots for this program from the active timetable
    const pg = activeTimetable?.programGroups?.find(g => String(g.program.id) === String(selectedProgramId));
    const slots = pg?.slots || [];

    return (
      <div className="space-y-4">
        <button onClick={() => setSelectedProgramId(null)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <ChevronLeft size={16} /> Back to Programs
        </button>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="page-title">{program?.name}</h1>
            <p className="page-subtitle">Timetable for {activeWeek?.label}</p>
          </div>
          {activeTimetable?.status === 'draft' && (
            <button className="btn-primary btn-sm px-4" onClick={() => publish(activeTimetable.id)}>
              <Send size={13} /> {t('timetable.publishTimetable', 'Publish')}
            </button>
          )}
        </div>

        {activeWeek && (
          <div className="py-2 border-b border-gray-100 mb-2">
            <p className="text-sm font-bold text-gray-900">{activeWeek.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">from {new Date(activeWeek.startDate).toLocaleDateString()} to {new Date(activeWeek.endDate).toLocaleDateString()}</p>
          </div>
        )}

        {slots.length === 0 ? (
          <div className="card p-12 text-center text-gray-400 italic">
            No sessions scheduled for this program in the active week.
          </div>
        ) : (
          <div className="space-y-3">
            {DAYS.map(day => {
              const daySlots = slots.filter(s => s.dayOfWeek === day);
              if (daySlots.length === 0) return null;
              return (
                <div key={day} className="space-y-2">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest px-1">{day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {daySlots.map(s => (
                      <div key={s.id} className="card p-4 flex items-start gap-4 hover:border-primary-300 transition-colors group">
                        <div className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2 text-center min-w-[80px] group-hover:bg-primary-50 group-hover:border-primary-100 transition-colors">
                          <p className="text-xs font-bold text-gray-900 group-hover:text-primary-700">{s.timeStart?.slice(0, 5)}</p>
                          <p className="text-[10px] text-gray-400 font-medium group-hover:text-primary-400">{s.timeEnd?.slice(0, 5)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{s.course?.name || '—'}</p>
                          <p className="text-xs text-gray-500 mt-1 truncate">{s.trainer?.user?.fullName || 'TBD'}</p>
                          {s.room?.name && <p className="text-[10px] text-gray-400 mt-0.5 bg-gray-100 inline-block px-1.5 py-0.5 rounded">{s.room.name}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">{t('timetable.title', 'Timetable Generator')}</h1>
          <p className="page-subtitle">{t('timetable.subtitle', 'Manage program schedules for your department')}</p>
        </div>
        <button
          className="btn-primary"
          onClick={generate}
          disabled={generating || !selectedWeekId || String(selectedWeekId) !== String([...weeks].sort((a, b) => b.weekNumber - a.weekNumber)[0]?.id)}
        >
          <Zap size={16} /> {generating ? t('common.generating', 'Generating…') : t('timetable.generateTimetable', 'Generate Timetable')}
        </button>
      </div>

      {activeWeek && (
        <div className="py-3 flex items-center justify-between border-b border-gray-100 mb-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center font-bold text-base">
              {activeWeek.weekNumber}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{activeWeek.label}</p>
              <p className="text-[11px] text-gray-400 mt-1">from {new Date(activeWeek.startDate).toLocaleDateString()} to {new Date(activeWeek.endDate).toLocaleDateString()}</p>
            </div>
          </div>
          <Badge value={activeWeek.status} />
        </div>
      )}

      {msg && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

      <div className="mt-4 space-y-1">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3 px-1">{t('nav.programs', 'Programs')}</p>
        {programs.map(p => (
          <button
            key={p.id}
            onClick={() => setSelectedProgramId(p.id)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all text-sm group"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={16} className="text-gray-400 group-hover:text-primary-600" />
              <span className="font-medium">{p.name}</span>
            </div>
            <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
          </button>
        ))}
      </div>

      {programs.length === 0 && (
        <div className="card p-12 text-center text-gray-400 italic">
          No programs found in this department.
        </div>
      )}
    </div>
  );
}
