import { useEffect, useState } from 'react';
import { Zap, Send, ChevronDown, ChevronUp } from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, ErrorAlert, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

export default function HodTimetable() {
  const { t } = useTranslation();
  const [weeks, setWeeks]           = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [expandedTT, setExpandedTT]     = useState({});
  const [selectedProg, setSelectedProg] = useState({});
  const [loading, setLoading]       = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg]               = useState('');
  const [error, setError]           = useState('');

  function load() {
    Promise.all([hodApi.getWeeks(), hodApi.getTimetables()])
      .then(([w, tt]) => { setWeeks(w.data||[]); setTimetables(tt.data||[]); setLoading(false); })
      .catch(() => setError(t('common.failedLoad','Failed to load')));
  }
  useEffect(load, []);

  async function generate() {
    if (!selectedWeek) return;
    setGenerating(true); setMsg(''); setError('');
    try {
      const r = await hodApi.generateTimetable({ weekId: selectedWeek });
      setMsg(t('timetable.generated','Generated: {{count}} sessions scheduled ({{skipped}} skipped)', {
        count: r.data.scheduled, skipped: r.data.skipped,
      }));
      load();
    } catch (e) { setError(e.response?.data?.message || t('timetable.generationFailed','Generation failed')); }
    finally { setGenerating(false); }
  }

  async function publish(id) { await hodApi.publishTimetable(id); load(); }

  const publishedWeeks = weeks.filter(w => w.status === 'published');

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">{t('timetable.title','Timetable Generator')}</h1>
        <p className="page-subtitle">{t('timetable.subtitle','Generate academic timetables based on trainer availability')}</p>
      </div>

      {/* Generation panel */}
      <div className="card p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[180px]">
            <label className="label">{t('timetable.selectPublishedWeek','Published Week')}</label>
            <select className="select" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}>
              <option value="">{t('timetable.selectWeek','— Select week —')}</option>
              {publishedWeeks.map(w => <option key={w.id} value={w.id}>{w.label}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={generate} disabled={generating || !selectedWeek}>
            <Zap size={16}/> {generating ? t('common.generating','Generating…') : t('timetable.generateTimetable','Generate Timetable')}
          </button>
        </div>
        {msg   && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">{msg}</p>}
        {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}
      </div>

      {timetables.length === 0 && (
        <div className="card p-10 text-center text-gray-400">{t('timetable.noTimetablesYet','No timetables generated yet.')}</div>
      )}

      {/* Timetable list */}
      {timetables.map(tt => {
        const isOpen    = expandedTT[tt.id];
        const progId    = selectedProg[tt.id];
        const progGroup = tt.programGroups?.find(g => String(g.program.id) === String(progId));
        const slots     = progGroup?.slots || [];

        return (
          <div key={tt.id} className="card overflow-hidden">
            {/* Header */}
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{tt.label}</p>
                <p className="text-xs text-gray-400">
                  {tt.academicWeek?.label} · {new Date(tt.generatedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-2 items-center flex-shrink-0">
                <Badge value={tt.status} />
                {tt.status === 'draft' && (
                  <button className="btn-primary btn-sm" onClick={() => publish(tt.id)}>
                    <Send size={13}/> {t('timetable.publishTimetable','Publish')}
                  </button>
                )}
                <button
                  className="btn-ghost btn-sm btn-icon"
                  onClick={() => setExpandedTT(e => ({ ...e, [tt.id]: !e[tt.id] }))}
                >
                  {isOpen ? <ChevronUp size={15}/> : <ChevronDown size={15}/>}
                </button>
              </div>
            </div>

            {isOpen && (
              <>
                {/* Program selector pills */}
                {tt.programGroups?.length > 0 && (
                  <div className="px-4 py-3 border-b border-gray-100 flex flex-wrap gap-2">
                    {tt.programGroups.map(g => (
                      <button
                        key={g.program.id}
                        onClick={() => setSelectedProg(p => ({ ...p, [tt.id]: String(g.program.id) }))}
                        className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors border ${
                          String(progId) === String(g.program.id)
                            ? 'bg-primary-600 text-white border-primary-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-primary-400'
                        }`}
                      >
                        {g.program.name} ({g.slots.length})
                      </button>
                    ))}
                  </div>
                )}

                {/* Slots for selected program — mobile card list */}
                {progId && slots.length === 0 && (
                  <p className="px-4 py-4 text-sm text-gray-400">{t('timetable.noSlotsForProgram','No slots for this program.')}</p>
                )}

                {progId && slots.length > 0 && (
                  <div className="divide-y divide-gray-50">
                    {slots.map(s => (
                      <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                        {/* Time badge */}
                        <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 py-1.5 text-center flex-shrink-0 min-w-[72px]">
                          <p className="text-xs font-mono font-bold text-blue-800">{s.timeStart?.slice(0,5)}</p>
                          <p className="text-[10px] text-blue-500">–{s.timeEnd?.slice(0,5)}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">{s.course?.name || '—'}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {s.dayOfWeek}
                            {s.trainer?.user?.fullName && ` · ${s.trainer.user.fullName}`}
                            {s.room?.name && ` · ${s.room.name}`}
                          </p>
                          {(s.course?.session?.academicLevel?.name || s.course?.session?.semester?.name) && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {s.course?.session?.academicLevel?.name}
                              {s.course?.session?.semester?.name && ` · ${s.course.session.semester.name}`}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {!progId && tt.programGroups?.length > 0 && (
                  <p className="px-4 py-4 text-sm text-gray-400 italic">{t('timetable.selectProgram','Select a program to view its timetable')}</p>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
