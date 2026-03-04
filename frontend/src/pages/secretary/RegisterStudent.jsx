import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const RegisterStudent = () => {
    const [formData, setFormData] = useState({
        student_name: '',
        student_email: '',
        student_password: '',
        parent_name: '',
        parent_email: '',
        parent_password: '',
        program_id: '',
        academic_level_id: '',
        session_id: '',
        is_adult: false
    });
    const [programs, setPrograms] = useState([]);
    const [levels, setLevels] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [progs, lvls, sess] = await Promise.all([
                    api.get('/admin/programs'),
                    api.get('/admin/academic_levels'),
                    api.get('/admin/sessions')
                ]);
                setPrograms(progs.data);
                setLevels(lvls.data);
                setSessions(sess.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/secretary/register-student', formData);
            setMessage('Student registered successfully!');
            setFormData({
                student_name: '',
                student_email: '',
                student_password: '',
                parent_name: '',
                parent_email: '',
                parent_password: '',
                program_id: '',
                academic_level_id: '',
                session_id: '',
                is_adult: false
            });
        } catch (err) {
            setMessage('Registration failed.');
        }
    };

    return (
        <div className="page-container">
            <h1>Register New Student</h1>
            {message && <div className="info-message">{message}</div>}
            <form onSubmit={handleSubmit} className="registration-form">
                <div className="form-section">
                    <h3>Student Details</h3>
                    <div className="form-group">
                        <label>Full Name</label>
                        <input type="text" value={formData.student_name} onChange={(e) => setFormData({...formData, student_name: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={formData.student_email} onChange={(e) => setFormData({...formData, student_email: e.target.value})} required />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input type="password" value={formData.student_password} onChange={(e) => setFormData({...formData, student_password: e.target.value})} required />
                    </div>
                </div>

                {!formData.is_adult && (
                    <div className="form-section">
                        <h3>Parent Details</h3>
                        <div className="form-group">
                            <label>Full Name</label>
                            <input type="text" value={formData.parent_name} onChange={(e) => setFormData({...formData, parent_name: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={formData.parent_email} onChange={(e) => setFormData({...formData, parent_email: e.target.value})} required />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <input type="password" value={formData.parent_password} onChange={(e) => setFormData({...formData, parent_password: e.target.value})} required />
                        </div>
                    </div>
                )}

                <div className="form-section">
                    <h3>Academic Details</h3>
                    <div className="form-group">
                        <label>Program</label>
                        <select value={formData.program_id} onChange={(e) => setFormData({...formData, program_id: e.target.value})} required>
                            <option value="">Select Program</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Level</label>
                        <select value={formData.academic_level_id} onChange={(e) => setFormData({...formData, academic_level_id: e.target.value})} required>
                            <option value="">Select Level</option>
                            {levels.map(l => <option key={l.id} value={l.id}>{l.level_name}</option>)}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Session</label>
                        <select value={formData.session_id} onChange={(e) => setFormData({...formData, session_id: e.target.value})} required>
                            <option value="">Select Session</option>
                            {sessions.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <button type="submit" className="btn-primary">Register Student</button>
            </form>
        </div>
    );
};

export default RegisterStudent;
