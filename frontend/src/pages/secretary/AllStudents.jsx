import { useState, useEffect } from 'react';
import { secretaryApi } from '../../api/secretaryApi';
import '../../styles/Secretary.css';

export default function AllStudents() {
    const [students, setStudents] = useState([]);
    const [programs, setPrograms] = useState([]);
    const [search, setSearch] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([secretaryApi.getStudents(), secretaryApi.getPrograms()])
            .then(([sRes, pRes]) => {
                setStudents(sRes.data.data || []);
                setPrograms(pRes.data.data || []);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, []);

    const filtered = students.filter(s => {
        const matchProg = !filterProgram || s.program_name === filterProgram;
        const q = search.toLowerCase();
        const matchSearch = !q || s.full_name?.toLowerCase().includes(q) || s.matricule?.toLowerCase().includes(q) || s.email?.toLowerCase().includes(q);
        return matchProg && matchSearch;
    });

    return (
        <div className="secretary-body">
            <div className="sec-page-head">
                <div>
                    <h1 className="sec-title">All Students</h1>
                    <p className="sec-sub">View and search students across all programs</p>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#555', fontWeight: 600, marginTop: 4 }}>
                    {filtered.length} of {students.length} students
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                <input
                    className="sec-input"
                    style={{ flex: 1, minWidth: 200 }}
                    placeholder="Search by name, matricule or email…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select className="sec-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)} style={{ minWidth: 180 }}>
                    <option value="">All Programs</option>
                    {programs.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
                {(search || filterProgram) && (
                    <button className="sec-btn-outline" onClick={() => { setSearch(''); setFilterProgram(''); }}>
                        Clear
                    </button>
                )}
            </div>

            {loading ? (
                <p style={{ textAlign: 'center', color: '#888', padding: '3rem 0' }}>Loading students…</p>
            ) : (
                <div className="sec-card" style={{ overflowX: 'auto' }}>
                    <table className="sec-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Matricule</th>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Program</th>
                                <th>Academic Year</th>
                                <th>Status</th>
                                <th>Registered</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.map((s, i) => (
                                <tr key={s.id}>
                                    <td style={{ color: '#888', fontSize: '0.8rem' }}>{i + 1}</td>
                                    <td>
                                        <code style={{ fontSize: '0.8rem', background: '#f3f4f6', padding: '0.15rem 0.4rem', borderRadius: 3 }}>
                                            {s.matricule}
                                        </code>
                                    </td>
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
                                    <td style={{ fontSize: '0.78rem', color: '#888' }}>
                                        {s.created_at ? new Date(s.created_at).toLocaleDateString() : '—'}
                                    </td>
                                </tr>
                            ))}
                            {!filtered.length && (
                                <tr>
                                    <td colSpan={9} style={{ textAlign: 'center', color: '#888', padding: '2rem' }}>
                                        No students match your filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}