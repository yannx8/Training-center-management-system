import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const SelectRole = () => {
    const [roles, setRoles] = useState(() => JSON.parse(localStorage.getItem('roles') || '[]'));
    const [selectedRole, setSelectedRole] = useState(() => {
        const r = JSON.parse(localStorage.getItem('roles') || '[]');
        return r[0] || '';
    });
    const navigate = useNavigate();
    const { login } = useAuth();
    const checked = useRef(false);

    useEffect(() => {
        if (checked.current) return;
        checked.current = true;
        if (roles.length === 0) navigate('/login');
    }, [roles, navigate]);

    const handleContinue = async () => {
        try {
            const tempToken = localStorage.getItem('tempToken');
            const response = await api.post('/auth/select-role',
                { role: selectedRole },
                { headers: { Authorization: `Bearer ${tempToken}` } }
            );
            login(response.data.user, response.data.token);
            navigate(`/${selectedRole.toLowerCase()}`);
            localStorage.removeItem('tempToken');
            localStorage.removeItem('roles');
            localStorage.removeItem('tempUser');
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-form">
                <h2>Select Your Role</h2>
                <div className="role-selection">
                    {roles.map(role => (
                        <label key={role} className="role-option">
                            <input
                                type="radio"
                                name="role"
                                value={role}
                                checked={selectedRole === role}
                                onChange={(e) => setSelectedRole(e.target.value)}
                            />
                            {role}
                        </label>
                    ))}
                </div>
                <button onClick={handleContinue} className="btn-primary">Continue</button>
            </div>
        </div>
    );
};

export default SelectRole;