
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { secretaryApi } from '../../api/secretaryApi';
import '../../styles/Secretary.css';

const TABS = ['Overview', 'Students'];

export default function SecretaryDashboard() {
    const { user } = useAuth();
    const [tab, setTab] = useState('Overview');
    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [filterProgram, setFilterProgram] = useState('');
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => { load(); }, []);

    async function load() {
        setLoading(true);
        try {
            const [studRes, progRes] = await Promise.all([
                secretaryApi.getStudents(),
                secretaryApi.getPrograms(),
            ]);
            setStudents(studRes.data.data || []);
            setPrograms(progRes.data.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    const filtered = students.filter(s => {
        const matchProg = !filterProgram || String(s.program_id) === filterProgram || s.program_name === filterProgram;
        const q = search.toLowerCase();
        const matchSearch = !q || s.full_name?.toLowerCase().includes(q) || s.matricule?.toLowerCase().includes(q);
        return matchProg && matchSearch;
    });

    const todayCount = students.filter(s => {
        if (!s.created_at) return false;
        return new Date(s.created_at).toDateString() === new Date().toDateString();
    }).length;

    return (
        <div className="secretary-body">
            <div className="sec-page-head">
                <div>
                    <h1 className="sec-title">Secretary Dashboard</h1>
                    <p className="sec-sub">Welcome, {user?.fullName}</p>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total Students', value: students.length, color: '#2c3e50' },
                    { label: 'Active Programs', value: programs.filter(p => p.status === 'active').length, color: '#2980b9' },
                    { label: "Today's Registrations", value: todayCount, color: '#27ae60' },
                ].map(stat => (
                    <div key={stat.label} className="sec-card" style={{ marginBottom: 0, textAlign: 'center' }}>
                        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: '0.8rem', color: '#555', marginTop: 4 }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="sec-tabs">
                {TABS.map(t => (
                    <button key={t} className={`sec-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
                ))}
            </div>

            {loading ? (
                <p style={{ color: '#888', padding: '2rem', textAlign: 'center' }}>Loading…</p>
            ) : tab === 'Overview' ? (
                <div className="sec-card">
                    <p className="sec-card-title">Recent Registrations</p>
                    <table className="sec-table">
                        <thead>
                            <tr>
                                <th>Matricule</th><th>Name</th><th>Program</th><th>Status</th><th>Registered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.slice(0, 10).map(s => (
                                <tr key={s.id}>
                                    <td><code style={{ fontSize: '0.8rem' }}>{s.matricule}</code></td>
                                    <td>{s.full_name}</td>
                                    <td>{s.program_name || '—'}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                                            background: s.enrollment_status === 'active' ? '#dcfce7' : '#f3f4f6',
                                            color: s.enrollment_status === 'active' ? '#166534' : '#555',
                                        }}>{s.enrollment_status || 'enrolled'}</span>
                                    </td>
                                    <td style={{ fontSize: '0.8rem', color: '#666' }}>
                                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))}
                            {!students.length && (
                                <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: '1.5rem' }}>No students yet</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                /* All Students Tab */
                <div className="sec-card">
                    <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                        <input
                            className="sec-input"
                            placeholder="Search by name or matricule…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ flex: 1, minWidth: 180 }}
                        />
                        <select
                            className="sec-select"
                            value={filterProgram}
                            onChange={e => setFilterProgram(e.target.value)}
                        >
                            <option value="">All Programs</option>
                            {programs.map(p => (
                                <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                        </select>
                    </div>
                    <table className="sec-table">
                        <thead>
                            <tr>
                                <th>Matricule</th><th>Name</th><th>Email</th><th>Phone</th><th>Program</th><th>Year</th><th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map(s => (
                                <tr key={s.id}>
                                    <td><code style={{ fontSize: '0.8rem' }}>{s.matricule}</code></td>
                                    <td style={{ fontWeight: 600 }}>{s.full_name}</td>
                                    <td style={{ fontSize: '0.82rem', color: '#555' }}>{s.email || '—'}</td>
                                    <td style={{ fontSize: '0.82rem', color: '#555' }}>{s.phone || '—'}</td>
                                    <td>{s.program_name || '—'}</td>
                                    <td style={{ fontSize: '0.82rem' }}>{s.academic_year_name || '—'}</td>
                                    <td>
                                        <span style={{
                                            padding: '0.15rem 0.5rem', borderRadius: 999, fontSize: '0.72rem', fontWeight: 600,
                                            background: s.enrollment_status === 'active' ? '#dcfce7' : '#f3f4f6',
                                            color: s.enrollment_status === 'active' ? '#166534' : '#555',
                                        }}>{s.enrollment_status || 'enrolled'}</span>
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: '1.5rem' }}>No students found</td></tr>
                            )}
                        </tbody>
                    </table>
                    <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: '#888' }}>
                        {filtered.length} student{filtered.length !== 1 ? 's' : ''} shown
                    </div>
                </div>
            )}
        </div>
    );
}