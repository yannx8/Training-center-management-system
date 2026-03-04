import { useState, useEffect } from 'react';
import { useFetch } from '../../hooks/useFetch';
import {
    generateTimetable,
    getTimetables,
    getTimetableByProgram,
    getPrograms,
    publishTimetable,
    getAcademicWeeks,
    createAcademicWeek,
    publishWeek,
} from '../../api/hodApi';
import '../../styles/Hod.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const TIME_SLOTS = [
    { start: '08:00', end: '10:00', label: '8h–10h' },
    { start: '10:00', end: '12:00', label: '10h–12h' },
    { start: '13:00', end: '15:00', label: '13h–15h' },
    { start: '15:00', end: '17:00', label: '15h–17h' },
    { start: '17:00', end: '19:00', label: '17h–19h' },
    { start: '19:00', end: '21:00', label: '19h–21h' },
];

export default function HodTimetable() {
    const { data: weeks, loading: weeksLoading, refetch: refetchWeeks } = useFetch(getAcademicWeeks);
    const { data: timetables, loading: ttLoad, refetch: reTT } = useFetch(getTimetables);
    const { data: programs, loading: pgLoad } = useFetch(getPrograms);

    const [showWeekForm, setShowWeekForm] = useState(false);
    const [weekForm, setWeekForm] = useState({ weekNumber: '', label: '', startDate: '', endDate: '', academicYearId: '' });

    const [selectedWeek, setSelectedWeek] = useState('');
    const [genLabel, setGenLabel] = useState('');
    const [genMsg, setGenMsg] = useState('');
    const [genErr, setGenErr] = useState('');
    const [generating, setGenerating] = useState(false);

    // Timetable viewer
    const [selTT, setSelTT] = useState('');
    const [selProg, setSelProg] = useState(null); // program object
    const [slots, setSlots] = useState(null);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [publishMsg, setPublishMsg] = useState('');

    async function handleCreateWeek() {
        try {
            await createAcademicWeek(weekForm);
            setShowWeekForm(false);
            refetchWeeks();
            setWeekForm({ weekNumber: '', label: '', startDate: '', endDate: '', academicYearId: '' });
            setGenErr('');
        } catch (err) {
            setGenErr(err.response?.data?.message || 'Failed to create week');
        }
    }

    async function handleGenerate() {
        setGenerating(true); setGenMsg(''); setGenErr('');
        try {
            const res = await generateTimetable({ weekId: selectedWeek, label: genLabel });
            setGenMsg(res.data.data.message);
            reTT();
        } catch (err) {
            setGenErr(err.response?.data?.message || 'Generation failed');
        } finally {
            setGenerating(false);
        }
    }

    async function handleViewProgram(prog) {
        if (!selTT) return;
        setSelProg(prog);
        setLoadingSlots(true);
        setSlots(null);
        setPublishMsg('');
        try {
            const res = await getTimetableByProgram(selTT, prog.id);
            setSlots(res.data.data);
        } catch {
            setSlots([]);
        } finally {
            setLoadingSlots(false);
        }
    }

    async function handlePublish(id) {
        await publishTimetable(id);
        reTT();
        setPublishMsg('Timetable published successfully. Students and trainers can now see it.');
        setTimeout(() => setPublishMsg(''), 5000);
    }

    // Build grid lookup
    const byDayTime = {};
    DAYS.forEach(day => {
        TIME_SLOTS.forEach(slot => {
            const key = `${day}|${slot.start}`;
            byDayTime[key] = (slots || []).find(s =>
                s.day_of_week === day && s.time_start === slot.start
            );
        });
    });

    const currentTT = (timetables || []).find(t => String(t.id) === String(selTT));
    const weekInfo = currentTT
        ? `From: ${new Date(currentTT.start_date || currentTT.week_label).toLocaleDateString('en-GB')}  To: ${new Date(currentTT.end_date || '').toLocaleDateString('en-GB')}`
        : '';

    return (
        <div>
            <div className="hod-page-head">
                <div>
                    <h1 className="hod-title">Timetable Management</h1>
                    <p className="hod-sub">Create academic weeks, generate timetables, and publish to students and trainers</p>
                </div>
                <button className="hod-btn" onClick={() => setShowWeekForm(!showWeekForm)}>
                    {showWeekForm ? 'Cancel' : '+ New Academic Week'}
                </button>
            </div>

            {genErr && <div className="hod-notice" style={{ background: '#fef2f2', borderColor: '#fca5a5', color: '#991b1b' }}>{genErr}</div>}
            {genMsg && <div className="hod-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>{genMsg}</div>}

            {/* ── Create Academic Week ── */}
            {showWeekForm && (
                <div className="hod-card">
                    <h3 className="hod-card-title">Create New Academic Week</h3>
                    <div className="hod-row">
                        <input className="hod-input" type="number" placeholder="Week #"
                            value={weekForm.weekNumber} onChange={e => setWeekForm({ ...weekForm, weekNumber: e.target.value })} />
                        <input className="hod-input" type="text" placeholder="Label (e.g. Week 3)"
                            value={weekForm.label} onChange={e => setWeekForm({ ...weekForm, label: e.target.value })} />
                        <input className="hod-input" type="date"
                            value={weekForm.startDate} onChange={e => setWeekForm({ ...weekForm, startDate: e.target.value })} />
                        <input className="hod-input" type="date"
                            value={weekForm.endDate} onChange={e => setWeekForm({ ...weekForm, endDate: e.target.value })} />
                        <button className="hod-btn" onClick={handleCreateWeek}>Create Week</button>
                    </div>
                </div>
            )}

            {/* ── Weeks List ── */}
            {!weeksLoading && weeks?.length > 0 && (
                <div className="hod-card">
                    <h3 className="hod-card-title">Academic Weeks</h3>
                    <div className="hod-table-wrap">
                        <table className="hod-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Label</th>
                                    <th>Start</th>
                                    <th>End</th>
                                    <th>Status</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {weeks.map(w => (
                                    <tr key={w.id}>
                                        <td>{w.week_number}</td>
                                        <td>{w.label}</td>
                                        <td>{new Date(w.start_date).toLocaleDateString('en-GB')}</td>
                                        <td>{new Date(w.end_date).toLocaleDateString('en-GB')}</td>
                                        <td>
                                            <span style={{
                                                padding: '0.2rem 0.6rem',
                                                borderRadius: 999,
                                                fontSize: '0.75rem',
                                                fontWeight: 600,
                                                background: w.status === 'published' ? '#dcfce7' : '#fef9c3',
                                                color: w.status === 'published' ? '#166534' : '#92400e'
                                            }}>{w.status}</span>
                                        </td>
                                        <td>
                                            {w.status === 'draft' && (
                                                <button className="hod-btn-sm" onClick={async () => { await publishWeek(w.id); refetchWeeks(); }}>
                                                    Publish Week
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── Generate ── */}
            <div className="hod-card">
                <h3 className="hod-card-title">Generate Timetable</h3>
                <div className="hod-row">
                    <select className="hod-select" value={selectedWeek} onChange={e => setSelectedWeek(e.target.value)}>
                        <option value="">-- Select Academic Week --</option>
                        {weeks?.filter(w => w.status === 'draft').map(w => (
                            <option key={w.id} value={w.id}>{w.label} ({new Date(w.start_date).toLocaleDateString('en-GB')} – {new Date(w.end_date).toLocaleDateString('en-GB')})</option>
                        ))}
                    </select>
                    <input className="hod-input" type="text" placeholder="Label (optional)"
                        value={genLabel} onChange={e => setGenLabel(e.target.value)} />
                    <button className="hod-btn" onClick={handleGenerate} disabled={generating || !selectedWeek}>
                        {generating ? 'Generating…' : 'Generate'}
                    </button>
                </div>
            </div>

            {/* ── View Timetables ── */}
            <div className="hod-card">
                <h3 className="hod-card-title">Timetables</h3>
                {ttLoad ? (
                    <p className="hod-msg">Loading…</p>
                ) : !timetables?.length ? (
                    <p className="hod-msg">No timetables generated yet.</p>
                ) : (
                    <>
                        <div className="hod-row" style={{ marginBottom: '1rem' }}>
                            <select className="hod-select" value={selTT} onChange={e => { setSelTT(e.target.value); setSlots(null); setSelProg(null); setPublishMsg(''); }}>
                                <option value="">-- Select Timetable --</option>
                                {timetables.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.label} · {t.status} {t.week_label ? `· ${t.week_label}` : ''}
                                    </option>
                                ))}
                            </select>
                            {currentTT?.status === 'draft' && selTT && (
                                <button className="hod-btn" onClick={() => handlePublish(currentTT.id)}>
                                    Publish Timetable
                                </button>
                            )}
                        </div>

                        {publishMsg && (
                            <div className="hod-notice" style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534', marginBottom: '1rem' }}>
                                {publishMsg}
                            </div>
                        )}

                        {selTT && (
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                                {/* Programs sidebar */}
                                <div style={{ width: 200, flexShrink: 0 }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                                        Programs
                                    </div>
                                    {pgLoad ? <p className="hod-msg">…</p> : (programs || []).map(p => (
                                        <div
                                            key={p.id}
                                            onClick={() => handleViewProgram(p)}
                                            style={{
                                                padding: '0.55rem 0.75rem',
                                                borderRadius: 4,
                                                cursor: 'pointer',
                                                fontSize: '0.875rem',
                                                background: selProg?.id === p.id ? '#1a1a2e' : '#f8f9fa',
                                                color: selProg?.id === p.id ? '#fff' : '#222',
                                                marginBottom: '0.35rem',
                                                border: selProg?.id === p.id ? '1px solid #1a1a2e' : '1px solid #e5e5e5',
                                                fontWeight: selProg?.id === p.id ? 600 : 400,
                                            }}
                                        >
                                            {p.name}
                                        </div>
                                    ))}
                                </div>

                                {/* Timetable grid */}
                                <div style={{ flex: 1, overflowX: 'auto' }}>
                                    {loadingSlots ? (
                                        <p className="hod-msg">Loading timetable…</p>
                                    ) : !selProg ? (
                                        <p className="hod-msg" style={{ color: '#999', fontStyle: 'italic' }}>Select a program to view its timetable</p>
                                    ) : slots !== null && (
                                        <>
                                            {currentTT && (
                                                <p style={{ fontSize: '0.82rem', color: '#555', marginBottom: '0.75rem' }}>
                                                    <strong>{selProg.name}</strong> —{' '}
                                                    {currentTT.week_label || currentTT.label}
                                                    {currentTT.start_date && ` · From: ${new Date(currentTT.start_date).toLocaleDateString('en-GB')} To: ${new Date(currentTT.end_date).toLocaleDateString('en-GB')}`}
                                                </p>
                                            )}
                                            {slots.length === 0 ? (
                                                <p className="hod-msg">No sessions scheduled for this program in this timetable.</p>
                                            ) : (
                                                <div className="hod-tt-grid">
                                                    {/* Header */}
                                                    <div className="hod-tt-timecell hod-tt-header"></div>
                                                    {DAYS.map(d => (
                                                        <div key={d} className="hod-tt-header">{d}</div>
                                                    ))}
                                                    {/* Rows */}
                                                    {TIME_SLOTS.map(slot => (
                                                        <>
                                                            <div key={`t-${slot.start}`} className="hod-tt-timecell">{slot.label}</div>
                                                            {DAYS.map(day => {
                                                                const key = `${day}|${slot.start}`;
                                                                const session = byDayTime[key];
                                                                return (
                                                                    <div key={key} className={`hod-tt-cell ${session ? 'hod-tt-cell-filled' : 'hod-tt-cell-empty'}`}>
                                                                        {session ? (
                                                                            <>
                                                                                <div style={{ fontWeight: 600, fontSize: '0.75rem' }}>{session.course_name}</div>
                                                                                <div style={{ fontSize: '0.68rem', color: '#555', marginTop: 2 }}>{session.trainer_name}</div>
                                                                                <div style={{ fontSize: '0.65rem', color: '#888' }}>{session.room_name}</div>
                                                                            </>
                                                                        ) : (
                                                                            <span style={{ color: '#ccc', fontSize: '0.7rem', fontStyle: 'italic' }}>—</span>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </>
                                                    ))}
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}