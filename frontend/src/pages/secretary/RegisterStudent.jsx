// FILE: /frontend/src/pages/secretary/RegisterStudent.jsx
import { useState, useEffect } from 'react';
import { secretaryApi } from '../../api/secretaryApi';
import '../../styles/Secretary.css';

const BLANK_PARENT = { firstName: '', lastName: '', email: '', phone: '', relationship: 'Father' };

const BLANK_FORM = {
    student: { firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '' },
    parents: [{ ...BLANK_PARENT }],
    enrollmentType: 'program',
    programId: '',
    certificationId: '',
};

export default function RegisterStudent() {
    const [form, setForm] = useState(BLANK_FORM);
    const [programs, setPrograms] = useState([]);
    const [certifications, setCertifications] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        Promise.all([secretaryApi.getPrograms(), secretaryApi.getCertifications()])
            .then(([pRes, cRes]) => {
                setPrograms(pRes.data.data || []);
                setCertifications(cRes.data.data || []);
            })
            .catch(() => {});
    }, []);

    function setStudent(field, val) {
        setForm(f => ({ ...f, student: { ...f.student, [field]: val } }));
    }

    function setParent(idx, field, val) {
        setForm(f => {
            const parents = [...f.parents];
            parents[idx] = { ...parents[idx], [field]: val };
            return { ...f, parents };
        });
    }

    function addParent() {
        setForm(f => ({ ...f, parents: [...f.parents, { ...BLANK_PARENT, relationship: 'Mother' }] }));
    }

    function removeParent(idx) {
        setForm(f => ({ ...f, parents: f.parents.filter((_, i) => i !== idx) }));
    }

    async function handleSubmit() {
        setError(''); setSuccess('');
        if (!form.student.firstName || !form.student.lastName || !form.student.dateOfBirth) {
            setError('First name, last name and date of birth are required.'); return;
        }
        if (form.enrollmentType === 'program' && !form.programId) {
            setError('Please select a program.'); return;
        }
        if (form.enrollmentType === 'certification' && !form.certificationId) {
            setError('Please select a certification.'); return;
        }

        setSubmitting(true);
        try {
            // Note: matricule field is intentionally excluded — backend auto-generates it
            const payload = {
                student: {
                    firstName: form.student.firstName,
                    lastName: form.student.lastName,
                    email: form.student.email || undefined,
                    phone: form.student.phone || undefined,
                    dateOfBirth: form.student.dateOfBirth,
                },
                parents: form.parents.filter(p => p.firstName && p.email),
                enrollmentType: form.enrollmentType,
                programId: form.enrollmentType === 'program' ? parseInt(form.programId) : undefined,
                certificationId: form.enrollmentType === 'certification' ? parseInt(form.certificationId) : undefined,
            };

            const res = await secretaryApi.registerStudent(payload);
            const mat = res.data?.data?.matricule || '';
            setSuccess(`✅ Student registered successfully! Matricule: ${mat}`);
            setForm(BLANK_FORM);
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div className="secretary-body">
            <div className="sec-page-head">
                <div>
                    <h1 className="sec-title">Register New Student</h1>
                    <p className="sec-sub">Fill in the form below — matricule is auto-generated</p>
                </div>
            </div>

            {success && (
                <div style={{ background: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '0.85rem 1.1rem', borderRadius: 6, marginBottom: '1.25rem', fontWeight: 600, fontSize: '0.9rem' }}>
                    {success}
                </div>
            )}
            {error && (
                <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.85rem 1.1rem', borderRadius: 6, marginBottom: '1.25rem', fontSize: '0.9rem' }}>
                    {error}
                </div>
            )}

            {/* Student Info */}
            <div className="sec-card">
                <p className="sec-card-title">👤 Student Information</p>

                {/* Matricule display-only notice */}
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, padding: '0.7rem 1rem', marginBottom: '1rem', fontSize: '0.82rem', color: '#1e40af' }}>
                    🔢 Matricule will be <strong>auto-generated</strong> by the system upon registration.
                </div>

                <div className="sec-form-grid">
                    <div className="sec-field">
                        <label className="sec-label">First Name *</label>
                        <input className="sec-input" value={form.student.firstName} onChange={e => setStudent('firstName', e.target.value)} placeholder="First name" />
                    </div>
                    <div className="sec-field">
                        <label className="sec-label">Last Name *</label>
                        <input className="sec-input" value={form.student.lastName} onChange={e => setStudent('lastName', e.target.value)} placeholder="Last name" />
                    </div>
                    <div className="sec-field">
                        <label className="sec-label">Date of Birth *</label>
                        <input className="sec-input" type="date" value={form.student.dateOfBirth} onChange={e => setStudent('dateOfBirth', e.target.value)} />
                    </div>
                    <div className="sec-field">
                        <label className="sec-label">Phone</label>
                        <input className="sec-input" value={form.student.phone} onChange={e => setStudent('phone', e.target.value)} placeholder="Phone number" />
                    </div>
                    <div className="sec-field" style={{ gridColumn: '1 / -1' }}>
                        <label className="sec-label">Email (optional — auto-generated if blank)</label>
                        <input className="sec-input" type="email" value={form.student.email} onChange={e => setStudent('email', e.target.value)} placeholder="student@email.com" />
                    </div>
                </div>
            </div>

            {/* Enrollment */}
            <div className="sec-card">
                <p className="sec-card-title">📚 Enrollment</p>
                <div className="sec-form-grid">
                    <div className="sec-field">
                        <label className="sec-label">Enrollment Type *</label>
                        <select className="sec-select" value={form.enrollmentType} onChange={e => setForm(f => ({ ...f, enrollmentType: e.target.value, programId: '', certificationId: '' }))}>
                            <option value="program">Academic Program</option>
                            <option value="certification">Certification</option>
                        </select>
                    </div>
                    {form.enrollmentType === 'program' ? (
                        <div className="sec-field">
                            <label className="sec-label">Program *</label>
                            <select className="sec-select" value={form.programId} onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}>
                                <option value="">— Select program —</option>
                                {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    ) : (
                        <div className="sec-field">
                            <label className="sec-label">Certification *</label>
                            <select className="sec-select" value={form.certificationId} onChange={e => setForm(f => ({ ...f, certificationId: e.target.value }))}>
                                <option value="">— Select certification —</option>
                                {certifications.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                    )}
                </div>
            </div>

            {/* Parents */}
            <div className="sec-card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p className="sec-card-title" style={{ margin: 0 }}>👨‍👩‍👧 Parent / Guardian</p>
                    <button className="sec-btn-sm" onClick={addParent}>+ Add Parent</button>
                </div>

                {form.parents.map((parent, idx) => (
                    <div key={idx} style={{ border: '1px solid #e5e5e5', borderRadius: 6, padding: '1rem', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2c3e50' }}>Parent {idx + 1}</span>
                            {form.parents.length > 1 && (
                                <button className="sec-btn-sm sec-btn-danger" onClick={() => removeParent(idx)}>Remove</button>
                            )}
                        </div>
                        <div className="sec-form-grid">
                            <div className="sec-field">
                                <label className="sec-label">First Name *</label>
                                <input className="sec-input" value={parent.firstName} onChange={e => setParent(idx, 'firstName', e.target.value)} placeholder="First name" />
                            </div>
                            <div className="sec-field">
                                <label className="sec-label">Last Name</label>
                                <input className="sec-input" value={parent.lastName} onChange={e => setParent(idx, 'lastName', e.target.value)} placeholder="Last name" />
                            </div>
                            <div className="sec-field">
                                <label className="sec-label">Email *</label>
                                <input className="sec-input" type="email" value={parent.email} onChange={e => setParent(idx, 'email', e.target.value)} placeholder="parent@email.com" />
                            </div>
                            <div className="sec-field">
                                <label className="sec-label">Phone</label>
                                <input className="sec-input" value={parent.phone} onChange={e => setParent(idx, 'phone', e.target.value)} placeholder="Phone" />
                            </div>
                            <div className="sec-field">
                                <label className="sec-label">Relationship</label>
                                <select className="sec-select" value={parent.relationship} onChange={e => setParent(idx, 'relationship', e.target.value)}>
                                    <option value="Father">Father</option>
                                    <option value="Mother">Mother</option>
                                    <option value="Guardian">Guardian</option>
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button className="sec-btn-outline" onClick={() => { setForm(BLANK_FORM); setError(''); setSuccess(''); }}>
                    Reset
                </button>
                <button className="sec-btn" onClick={handleSubmit} disabled={submitting} style={{ opacity: submitting ? 0.6 : 1 }}>
                    {submitting ? 'Registering…' : 'Register Student'}
                </button>
            </div>
        </div>
    );
}