import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-brand">
                <Link to="/">TCMS</Link>
            </div>
            <div className="navbar-user">
                {user && (
                    <>
                        <span>{user.full_name} ({user.role})</span>
                        <button onClick={handleLogout} className="btn-logout">Logout</button>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
