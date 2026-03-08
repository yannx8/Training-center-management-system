// FILE: /frontend/src/pages/student/StudentCertTimetable.jsx
import { useState, useEffect } from 'react';
import { getCertTimetable, getCertTimetableWeeks } from '../../api/studentApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentCertTimetable() {
    const [weeks, setWeeks] = useState([]);
    const [selectedWeek, setSelectedWeek] = useState(null);
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getCertTimetableWeeks().then(r => {
            const w = r.data.data || [];
            setWeeks(w);
            if (w.length > 0) setSelectedWeek(w[0]);
        }).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedWeek) {
            getCertTimetable({ weekId: selectedWeek.id })
                .then(r => setSlots(r.data.data || []));
        }
    }, [selectedWeek]);

    if (loading) return <div className="p-6 text-gray-500">Loading…</div>;

    if (weeks.length === 0) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center py-16">
                <div className="text-5xl mb-4">📅</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No certification timetable yet</h2>
                <p className="text-gray-500">Your certification trainer will generate a timetable after collecting availability.</p>
            </div>
        );
    }

    // Group slots by cert then day
    const byCert = {};
    for (const s of slots) {
        if (!byCert[s.certification_id]) {
            byCert[s.certification_id] = { name: s.certification_name, byDay: {} };
        }
        if (!byCert[s.certification_id].byDay[s.day_of_week]) {
            byCert[s.certification_id].byDay[s.day_of_week] = [];
        }
        byCert[s.certification_id].byDay[s.day_of_week].push(s);
    }

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">Certification Timetable</h1>
            <p className="text-gray-500 text-sm mb-6">Your scheduled sessions for each certification.</p>

            {/* Week selector */}
            <div className="flex flex-wrap gap-2 mb-6">
                {weeks.map(w => (
                    <button key={w.id} onClick={() => setSelectedWeek(w)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                            selectedWeek?.id === w.id
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                        }`}>
                        {w.label}
                        <span className="block text-xs opacity-70">
                            {new Date(w.start_date).toLocaleDateString()}
                        </span>
                    </button>
                ))}
            </div>

            {Object.values(byCert).length === 0 ? (
                <p className="text-gray-500">No sessions for this week.</p>
            ) : (
                Object.entries(byCert).map(([certId, cert]) => (
                    <div key={certId} className="mb-8">
                        <h2 className="font-semibold text-gray-800 mb-3 text-lg">{cert.name}</h2>
                        <div className="overflow-x-auto rounded-xl border">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        {DAYS.map(d => (
                                            <th key={d} className="px-3 py-3 text-xs font-semibold text-gray-600 text-left">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="align-top">
                                        {DAYS.map(d => (
                                            <td key={d} className="px-3 py-3 border-r last:border-r-0">
                                                {(cert.byDay[d] || []).length === 0 ? (
                                                    <span className="text-gray-300 text-xs">—</span>
                                                ) : (
                                                    cert.byDay[d].map(s => (
                                                        <div key={s.id} className="mb-2 bg-indigo-50 rounded-lg p-2 text-xs">
                                                            <p className="font-semibold text-indigo-800">
                                                                {s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}
                                                            </p>
                                                            {s.room_name && <p className="text-indigo-600">{s.room_name}</p>}
                                                            <p className="text-gray-500">{s.trainer_name}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
}
