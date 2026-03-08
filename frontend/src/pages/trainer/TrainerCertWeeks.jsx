// FILE: /frontend/src/pages/trainer/TrainerCertWeeks.jsx
import { useState, useEffect } from 'react';
import {
    getCertifications,
    getCertWeeks,
    createCertWeek,
    publishCertWeek,
    generateCertTimetable,
    getCertTimetables,
    getCertTimetableSlots,
} from '../../api/trainerApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function TrainerCertWeeks() {
    const [certs, setCerts] = useState([]);
    const [selectedCert, setSelectedCert] = useState(null);
    const [weeks, setWeeks] = useState([]);
    const [generatedTimetables, setGeneratedTimetables] = useState([]);
    const [viewingSlots, setViewingSlots] = useState(null); // { certId, weekId, label, slots[] }
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // Form state
    const [form, setForm] = useState({ weekNumber: '', label: '', startDate: '', endDate: '' });
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        getCertifications().then(r => setCerts(r.data.data || []));
        getCertTimetables().then(r => setGeneratedTimetables(r.data.data || []));
    }, []);

    useEffect(() => {
        if (selectedCert) {
            setLoading(true);
            getCertWeeks(selectedCert.id)
                .then(r => setWeeks(r.data.data || []))
                .finally(() => setLoading(false));
        }
    }, [selectedCert]);

    const flash = (text, isErr = false) => {
        setMsg({ text, isErr });
        setTimeout(() => setMsg(null), 4000);
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            await createCertWeek({ certificationId: selectedCert.id, ...form });
            flash('Week created');
            setShowForm(false);
            setForm({ weekNumber: '', label: '', startDate: '', endDate: '' });
            getCertWeeks(selectedCert.id).then(r => setWeeks(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to create week', true);
        }
    };

    const handlePublish = async (weekId) => {
        try {
            await publishCertWeek(weekId);
            flash('Week published — students can now submit availability');
            getCertWeeks(selectedCert.id).then(r => setWeeks(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to publish', true);
        }
    };

    const handleGenerate = async (weekId, weekLabel) => {
        try {
            setLoading(true);
            const r = await generateCertTimetable({ certificationId: selectedCert.id, weekId });
            flash(r.data.data.message);
            getCertTimetables().then(r => setGeneratedTimetables(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Generation failed', true);
        } finally {
            setLoading(false);
        }
    };

    const handleViewSlots = async (certId, weekId, label) => {
        const r = await getCertTimetableSlots(certId, weekId);
        setViewingSlots({ certId, weekId, label, slots: r.data.data || [] });
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">Certification Scheduling</h1>
            <p className="text-gray-500 text-sm mb-6">
                Create and publish a week → students submit availability → generate timetable
            </p>

            {msg && (
                <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${msg.isErr ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {msg.text}
                </div>
            )}

            {/* Cert selector */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select your Certification</label>
                <div className="flex flex-wrap gap-2">
                    {certs.length === 0 && <p className="text-gray-500 text-sm">No certifications assigned.</p>}
                    {certs.map(c => (
                        <button
                            key={c.id}
                            onClick={() => { setSelectedCert(c); setViewingSlots(null); }}
                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                                selectedCert?.id === c.id
                                    ? 'bg-indigo-600 text-white border-indigo-600'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                            }`}
                        >
                            {c.name} <span className="opacity-70">({c.code})</span>
                        </button>
                    ))}
                </div>
            </div>

            {selectedCert && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left: weeks management */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="font-semibold text-gray-800">Weeks — {selectedCert.name}</h2>
                            <button
                                onClick={() => setShowForm(v => !v)}
                                className="text-sm px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                                + New Week
                            </button>
                        </div>

                        {showForm && (
                            <form onSubmit={handleCreate} className="bg-gray-50 border rounded-xl p-4 mb-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Week #</label>
                                        <input
                                            type="number" value={form.weekNumber} min="1"
                                            onChange={e => setForm(f => ({ ...f, weekNumber: e.target.value }))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm" required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Label</label>
                                        <input
                                            type="text" value={form.label} placeholder="e.g. Week 1"
                                            onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm" required
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">Start Date</label>
                                        <input type="date" value={form.startDate}
                                            onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm" required />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-600 mb-1 block">End Date</label>
                                        <input type="date" value={form.endDate}
                                            onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
                                            className="w-full border rounded-lg px-3 py-2 text-sm" required />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                                        Create Week
                                    </button>
                                    <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-100">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        )}

                        {loading ? (
                            <p className="text-gray-500 text-sm">Loading…</p>
                        ) : weeks.length === 0 ? (
                            <p className="text-gray-500 text-sm">No weeks yet. Create one above.</p>
                        ) : (
                            <div className="space-y-3">
                                {weeks.map(w => (
                                    <div key={w.id} className="border rounded-xl p-4 bg-white">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="font-medium text-gray-800">{w.label}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">
                                                    {new Date(w.start_date).toLocaleDateString()} – {new Date(w.end_date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                                w.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                            }`}>
                                                {w.status}
                                            </span>
                                        </div>

                                        <div className="flex gap-2 mt-3 flex-wrap">
                                            {w.status === 'draft' && (
                                                <button
                                                    onClick={() => handlePublish(w.id)}
                                                    className="text-xs px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                                                >
                                                    Publish Week
                                                </button>
                                            )}
                                            {w.status === 'published' && (
                                                <button
                                                    onClick={() => handleGenerate(w.id, w.label)}
                                                    disabled={loading}
                                                    className="text-xs px-3 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
                                                >
                                                    {loading ? 'Generating…' : 'Generate Timetable'}
                                                </button>
                                            )}
                                        </div>

                                        {w.status === 'published' && (
                                            <p className="text-xs text-green-600 mt-2">
                                                ✓ Students can submit availability for this week
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Right: generated timetables for this cert */}
                    <div>
                        <h2 className="font-semibold text-gray-800 mb-3">Generated Timetables</h2>
                        {generatedTimetables.filter(t => t.certification_id === selectedCert.id).length === 0 ? (
                            <p className="text-gray-500 text-sm">No timetables generated yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {generatedTimetables
                                    .filter(t => t.certification_id === selectedCert.id)
                                    .map(t => (
                                    <div key={`${t.certification_id}-${t.week_id}`} className="border rounded-xl p-4 bg-white">
                                        <p className="font-medium text-gray-800">{t.week_label}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {new Date(t.start_date).toLocaleDateString()} – {new Date(t.end_date).toLocaleDateString()}
                                        </p>
                                        <p className="text-xs text-indigo-600 mt-1">{t.slot_count} session(s)</p>
                                        <button
                                            onClick={() => handleViewSlots(t.certification_id, t.week_id, t.week_label)}
                                            className="mt-2 text-xs px-3 py-1 border border-indigo-300 text-indigo-700 rounded hover:bg-indigo-50"
                                        >
                                            View Timetable
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Timetable slot detail modal */}
            {viewingSlots && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="font-semibold text-gray-800">Timetable — {viewingSlots.label}</h2>
                            <button onClick={() => setViewingSlots(null)} className="text-gray-500 hover:text-gray-800 text-xl">✕</button>
                        </div>
                        <div className="p-6">
                            {viewingSlots.slots.length === 0 ? (
                                <p className="text-gray-500 text-sm">No slots found.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left text-gray-600">
                                                <th className="pb-2 pr-4">Day</th>
                                                <th className="pb-2 pr-4">Time</th>
                                                <th className="pb-2 pr-4">Room</th>
                                                <th className="pb-2">Trainer</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {viewingSlots.slots.map(s => (
                                                <tr key={s.id} className="border-b hover:bg-gray-50">
                                                    <td className="py-2 pr-4 font-medium">{s.day_of_week}</td>
                                                    <td className="py-2 pr-4 text-gray-600">
                                                        {s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}
                                                    </td>
                                                    <td className="py-2 pr-4 text-gray-600">{s.room_name || '—'}</td>
                                                    <td className="py-2 text-gray-600">{s.trainer_name}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
