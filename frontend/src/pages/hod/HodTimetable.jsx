import { useEffect, useState } from 'react';
import {
  Zap, Send, ChevronLeft, ChevronRight, BookOpen,
  CheckCircle, AlertCircle, Circle, GraduationCap
} from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, Badge } from '../../components/ui';
import TimetableGrid from '../../components/ui/TimetableGrid';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

// ─── badge helpers ─────────────────────────────────────────────────────────────
function ScheduledBadge() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full flex-shrink-0">
      <CheckCircle size={10} /> Scheduled
    </span>
  );
}
function NotScheduledBadge() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-500 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex-shrink-0">
      <AlertCircle size={10} /> Not scheduled
    </span>
  );
}
function NoTimetableBadge() {
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0">
      <Circle size={10} /> No timetable
    </span>
  );
}

// ─── breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ program, level, onGoPrograms, onGoLevels }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500">
      <button onClick={onGoPrograms} className="hover:text-primary-600 font-medium">
        Programs
      </button>
      {program && (
        <>
          <ChevronRight size={12} />
          <button
            onClick={level ? onGoLevels : undefined}
            className={level ? 'hover:text-primary-600 cursor-pointer' : 'text-gray-700 font-semibold cursor-default'}
          >
            {program.name}
          </button>
        </>
      )}
      {level && (
        <>
          <ChevronRight size={12} />
          <span className="text-gray-700 font-semibold">{level.name}</span>
        </>
      )}
    </div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────────
export default function HodTimetable() {
  // remote data
  const [weeks, setWeeks] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [selectedWeekId, setSelectedWeekId] = useState('');

  // 3-level navigation: 'programs' | 'levels' | 'slots'
  const [view, setView] = useState('programs');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedLevel, setSelectedLevel] = useState(null);

  // ui
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // ── load ────────────────────────────────────────────────────────────────────
  function load() {
    setLoading(true);
    Promise.all([hodApi.getWeeks(), hodApi.getTimetables(), hodApi.getPrograms()])
      .then(([w, tt, p]) => {
        const published = (w.data || []).filter(ww => ww.status === 'published');
        setWeeks(published);
        setTimetables(tt.data || []);
        setPrograms(p.data || []);
        if (published.length > 0) {
          const latest = [...published].sort((a, b) => b.weekNumber - a.weekNumber)[0];
          setSelectedWeekId(String(latest.id));
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load data');
        setLoading(false);
      });
  }
  useEffect(load, []);

  // ── generate ────────────────────────────────────────────────────────────────
  async function generate() {
    if (!selectedWeekId) return;
    setGenerating(true); setMsg(''); setError('');
    try {
      const r = await hodApi.generateTimetable({ weekId: selectedWeekId });
      setMsg(`Generated: ${r.data.count} sessions scheduled (${r.data.skipped} skipped)`);
      load();
    } catch (e) {
      setError(e.response?.data?.message || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  }

  async function publish(id) {
    try { await hodApi.publishTimetable(id); load(); }
    catch (e) { alert(e.response?.data?.message || 'Failed to publish'); }
  }

  // ── derived data ────────────────────────────────────────────────────────────
  if (loading) return <PageLoader />;

  const activeWeek = weeks.find(w => String(w.id) === String(selectedWeekId));

  const activeTimetable = timetables.find(
    tt => String(tt.academicWeekId) === String(selectedWeekId)
  );

  // All slots for a program (all levels combined)
  function getSlotsForProgram(programId) {
    if (!activeTimetable) return [];
    const pg = activeTimetable.programGroups?.find(
      g => String(g.program.id) === String(programId)
    );
    return pg?.slots || [];
  }

  // Slots filtered to one specific level
  function getSlotsForLevel(programId, levelId) {
    return getSlotsForProgram(programId).filter(
      s => String(s.course?.session?.academicLevel?.id) === String(levelId)
    );
  }

  function programHasAnySchedule(programId) {
    return getSlotsForProgram(programId).length > 0;
  }

  function levelHasSchedule(programId, levelId) {
    return getSlotsForLevel(programId, levelId).length > 0;
  }

  const latestWeekId = [...weeks].sort((a, b) => b.weekNumber - a.weekNumber)[0]?.id;
  const canGenerate = selectedWeekId && String(selectedWeekId) === String(latestWeekId);

  // ── navigation helpers ──────────────────────────────────────────────────────
  function goPrograms() {
    setView('programs');
    setSelectedProgram(null);
    setSelectedLevel(null);
  }
  function goLevels(prog) {
    setSelectedProgram(prog);
    setSelectedLevel(null);
    setView('levels');
  }
  function goSlots(prog, level) {
    setSelectedProgram(prog);
    setSelectedLevel(level);
    setView('slots');
  }

  // ── normalise slots for TimetableGrid ───────────────────────────────────────
  function normaliseSlotsForGrid(slots) {
    return slots.map(s => ({
      ...s,
      type: 'academic',
      subject: s.course?.name || '—',
      levelName: s.course?.session?.academicLevel?.name,
      semesterName: s.course?.session?.semester?.name,
      weekLabel: activeWeek?.label,
    }));
  }

  // ── shared header ───────────────────────────────────────────────────────────
  const PageHeader = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div>
          <h1 className="page-title">Timetable Generator</h1>
          <p className="page-subtitle">Manage program schedules for your department</p>
        </div>
        <button
          className="btn-primary"
          onClick={generate}
          disabled={generating || !canGenerate}
        >
          <Zap size={16} />
          {generating ? 'Generating…' : 'Generate Timetable'}
        </button>
      </div>

      {activeWeek && (
        <div className="flex items-center justify-between py-2 border-b border-gray-100 flex-wrap gap-2">
          <div>
            <p className="text-sm font-bold text-gray-900">{activeWeek.label}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              {new Date(activeWeek.startDate).toLocaleDateString()} → {new Date(activeWeek.endDate).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Badge value={activeWeek.status} />
            {activeTimetable?.status === 'draft' && (
              <button
                className="btn-primary btn-sm px-3"
                onClick={() => publish(activeTimetable.id)}
              >
                <Send size={13} /> Publish Timetable
              </button>
            )}
            {activeTimetable?.status === 'published' && (
              <span className="text-[10px] font-semibold text-green-600 bg-green-50 border border-green-200 px-2 py-1 rounded-full">
                ✓ Timetable published
              </span>
            )}
          </div>
        </div>
      )}

      {msg && <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{msg}</p>}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW 1 — Program list
  // ══════════════════════════════════════════════════════════════════════════════
  if (view === 'programs') {
    return (
      <div className="space-y-4">
        <PageHeader />

        {programs.length === 0 ? (
          <div className="card p-12 text-center text-gray-400 italic">
            No programs found in this department.
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mb-3">
              Programs ({programs.length})
            </p>

            {programs.map(prog => {
              const hasLevels = prog.levels && prog.levels.length > 0;
              const hasSchedule = programHasAnySchedule(prog.id);

              return (
                <button
                  key={prog.id}
                  onClick={() => goLevels(prog)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all text-sm group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <GraduationCap size={16} className="text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                    <div className="text-left min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{prog.name}</p>
                      {hasLevels && (
                        <p className="text-[11px] text-gray-400 mt-0.5">
                          {prog.levels.length} level{prog.levels.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!activeTimetable
                      ? <NoTimetableBadge />
                      : hasSchedule
                        ? <ScheduledBadge />
                        : <NotScheduledBadge />
                    }
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW 2 — Level list for a program
  // ══════════════════════════════════════════════════════════════════════════════
  if (view === 'levels') {
    const prog = selectedProgram;
    const levels = [...(prog?.levels || [])].sort((a, b) => a.levelOrder - b.levelOrder);

    return (
      <div className="space-y-4">
        <PageHeader />

        <button
          onClick={goPrograms}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Programs
        </button>

        <Breadcrumb program={prog} onGoPrograms={goPrograms} />

        <div>
          <h2 className="text-base font-bold text-gray-900">{prog.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">Click a level to view its timetable</p>
        </div>

        {levels.length === 0 ? (
          // No levels — jump straight to slots
          <button
            onClick={() => goSlots(prog, null)}
            className="w-full flex items-center justify-between px-3 py-3 rounded-xl hover:bg-gray-100 transition-all text-sm group"
          >
            <div className="flex items-center gap-3">
              <BookOpen size={16} className="text-gray-400 group-hover:text-primary-600" />
              <span className="font-medium text-gray-900">View all sessions</span>
            </div>
            <div className="flex items-center gap-2">
              {!activeTimetable
                ? <NoTimetableBadge />
                : programHasAnySchedule(prog.id)
                  ? <ScheduledBadge />
                  : <NotScheduledBadge />
              }
              <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
            </div>
          </button>
        ) : (
          <div className="space-y-1 mt-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest px-1 mb-3">
              Levels ({levels.length})
            </p>
            {levels.map(level => {
              const hasSchedule = levelHasSchedule(prog.id, level.id);
              return (
                <button
                  key={level.id}
                  onClick={() => goSlots(prog, level)}
                  className="w-full flex items-center justify-between px-3 py-3 rounded-xl text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-all text-sm group"
                >
                  <div className="flex items-center gap-3">
                    <BookOpen size={16} className="text-gray-400 group-hover:text-primary-600 flex-shrink-0" />
                    <span className="font-semibold text-gray-900">{level.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {!activeTimetable
                      ? <NoTimetableBadge />
                      : hasSchedule
                        ? <ScheduledBadge />
                        : <NotScheduledBadge />
                    }
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // VIEW 3 — Timetable slots (shared TimetableGrid component)
  // ══════════════════════════════════════════════════════════════════════════════
  if (view === 'slots') {
    const prog = selectedProgram;
    const level = selectedLevel;

    const rawSlots = level
      ? getSlotsForLevel(prog.id, level.id)
      : getSlotsForProgram(prog.id);

    const sessions = normaliseSlotsForGrid(rawSlots);
    const title = level ? `${prog.name} — ${level.name}` : prog.name;

    return (
      <div className="space-y-4">
        <PageHeader />

        <button
          onClick={() => setView('levels')}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ChevronLeft size={16} /> Back to Levels
        </button>

        <Breadcrumb
          program={prog}
          level={level}
          onGoPrograms={goPrograms}
          onGoLevels={() => setView('levels')}
        />

        <div>
          <h2 className="text-base font-bold text-gray-900">{title}</h2>
          {activeWeek && (
            <p className="text-xs text-gray-400 mt-0.5">
              {activeWeek.label} · {new Date(activeWeek.startDate).toLocaleDateString()} → {new Date(activeWeek.endDate).toLocaleDateString()}
            </p>
          )}
        </div>

        {!activeTimetable ? (
          <div className="card p-12 text-center text-gray-400 italic">
            No timetable generated yet. Click "Generate Timetable" above.
          </div>
        ) : (
          <TimetableGrid
            sessions={sessions}
            getDay={s => s.dayOfWeek}
            getType={s => s.type}
            emptyMessage={`No sessions scheduled for ${level ? 'this level' : 'this program'} yet.`}
          />
        )}
      </div>
    );
  }

  return null;
}