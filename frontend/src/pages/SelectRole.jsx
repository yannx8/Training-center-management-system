import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axiosInstance';
import { useAuth } from '../context/AuthContext';

const SelectRole = () => {
    const [roles, setRoles] = useState([]);
    const [selectedRole, setSelectedRole] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    useEffect(() => {
        const storedRoles = JSON.parse(localStorage.getItem('roles') || '[]');
        if (storedRoles.length === 0) {
            navigate('/login');
        }
        setRoles(storedRoles);
        setSelectedRole(storedRoles[0]);
    }, [navigate]);

    const handleContinue = async () => {
        try {
            const tempToken = localStorage.getItem('tempToken');
            const response = await api.post('/auth/select-role', 
                { role: selectedRole },
                { headers: { Authorization: `Bearer ${tempToken}` } }
            );
            login(response.data.user, response.data.token);
            navigate(`/dashboard/${selectedRole.toLowerCase()}`);
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
                <button onClick={handleContinue} className="btn-primary">Continue to Login</button>
            </div>
        </div>
    );
};

export default SelectRole;
