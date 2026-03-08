// FILE: /frontend/src/pages/student/StudentCertAvailability.jsx
import { useState, useEffect } from 'react';
import {
    getCertAvailabilityWeeks,
    getCertAvailability,
    submitCertAvailability,
    deleteCertAvailability,
} from '../../api/studentApi';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function StudentCertAvailability() {
    const [certWeeks, setCertWeeks] = useState([]);
    const [selectedCertWeek, setSelectedCertWeek] = useState(null);
    const [availability, setAvailability] = useState([]);
    const [loading, setLoading] = useState(true);
    const [msg, setMsg] = useState(null);
    const [form, setForm] = useState({ dayOfWeek: 'Monday', timeStart: '08:00', timeEnd: '10:00' });

    useEffect(() => {
        getCertAvailabilityWeeks()
            .then(r => {
                const weeks = r.data.data || [];
                setCertWeeks(weeks);
                if (weeks.length > 0) setSelectedCertWeek(weeks[0]);
            })
            .finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (selectedCertWeek) {
            getCertAvailability({ weekId: selectedCertWeek.week_id })
                .then(r => setAvailability(r.data.data || []));
        }
    }, [selectedCertWeek]);

    const flash = (text, isErr = false) => {
        setMsg({ text, isErr });
        setTimeout(() => setMsg(null), 4000);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await submitCertAvailability({
                academicWeekId: selectedCertWeek.week_id,
                dayOfWeek: form.dayOfWeek,
                timeStart: form.timeStart,
                timeEnd: form.timeEnd,
            });
            flash('Availability submitted');
            getCertAvailability({ weekId: selectedCertWeek.week_id })
                .then(r => setAvailability(r.data.data || []));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to submit', true);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteCertAvailability(id);
            setAvailability(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to delete', true);
        }
    };

    if (loading) return <div className="p-6 text-gray-500">Loading…</div>;

    if (certWeeks.length === 0) {
        return (
            <div className="p-6 max-w-2xl mx-auto text-center py-16">
                <div className="text-5xl mb-4">📋</div>
                <h2 className="text-xl font-semibold text-gray-700 mb-2">No availability to submit</h2>
                <p className="text-gray-500">
                    You'll see a week here once your certification trainer publishes a scheduling week.
                </p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-1">Certification Availability</h1>
            <p className="text-gray-500 text-sm mb-6">
                Submit your available time slots for the latest scheduling week. Your trainer will use these to generate the timetable.
            </p>

            {msg && (
                <div className={`mb-4 px-4 py-3 rounded text-sm font-medium ${msg.isErr ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                    {msg.text}
                </div>
            )}

            {certWeeks.length > 1 && (
                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Your Certifications</label>
                    <div className="flex flex-wrap gap-2">
                        {certWeeks.map(cw => (
                            <button
                                key={cw.certification_id}
                                onClick={() => setSelectedCertWeek(cw)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition ${
                                    selectedCertWeek?.certification_id === cw.certification_id
                                        ? 'bg-indigo-600 text-white border-indigo-600'
                                        : 'bg-white text-gray-700 border-gray-300 hover:border-indigo-400'
                                }`}
                            >
                                {cw.certification_name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {selectedCertWeek && (
                <>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6">
                        <p className="text-sm font-semibold text-indigo-800">{selectedCertWeek.certification_name}</p>
                        <p className="text-sm text-indigo-700 mt-0.5">
                            <span className="font-medium">{selectedCertWeek.week_label}</span>
                            {' — '}
                            {new Date(selectedCertWeek.start_date).toLocaleDateString()} to{' '}
                            {new Date(selectedCertWeek.end_date).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-indigo-500 mt-1">Latest published week</p>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-4 mb-6">
                        <h3 className="font-medium text-gray-800 mb-3">Add Available Slot</h3>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">Day</label>
                                <select value={form.dayOfWeek}
                                    onChange={e => setForm(f => ({ ...f, dayOfWeek: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm">
                                    {DAYS.map(d => <option key={d}>{d}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">From</label>
                                <input type="time" value={form.timeStart}
                                    onChange={e => setForm(f => ({ ...f, timeStart: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm" required />
                            </div>
                            <div>
                                <label className="text-xs text-gray-600 mb-1 block">To</label>
                                <input type="time" value={form.timeEnd}
                                    onChange={e => setForm(f => ({ ...f, timeEnd: e.target.value }))}
                                    className="w-full border rounded-lg px-3 py-2 text-sm" required />
                            </div>
                        </div>
                        <button type="submit"
                            className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
                            Add Slot
                        </button>
                    </form>

                    <div>
                        <h3 className="font-medium text-gray-800 mb-3">
                            Submitted Slots <span className="text-sm font-normal text-gray-500">({availability.length})</span>
                        </h3>
                        {availability.length === 0 ? (
                            <p className="text-gray-500 text-sm">No slots yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {DAYS.map(day => {
                                    const daySlots = availability.filter(s => s.day_of_week === day);
                                    if (!daySlots.length) return null;
                                    return (
                                        <div key={day} className="border rounded-xl overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 border-b">{day}</div>
                                            <div className="divide-y">
                                                {daySlots.map(s => (
                                                    <div key={s.id} className="px-4 py-2 flex items-center justify-between">
                                                        <span className="text-sm">{s.time_start?.slice(0,5)} – {s.time_end?.slice(0,5)}</span>
                                                        <button onClick={() => handleDelete(s.id)}
                                                            className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50">
                                                            Remove
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
