// FILE: /frontend/src/pages/parent/ParentLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
    { to: '/parent',            label: 'My Children',      end: true  },
    { to: '/parent/complaints', label: 'Submit Complaint', end: false },
];

export default function ParentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() { logout(); navigate('/login'); }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            <aside style={{
                width: 230,
                minWidth: 230,
                background: '#7c3aed',  // purple — distinct from other roles
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'sticky',
                top: 0,
            }}>
                <div style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Parent Portal
                </div>
                <nav style={{ flex: 1, padding: '0.75rem 0' }}>
                    {NAV.map(n => (
                        <NavLink
                            key={n.to}
                            to={n.to}
                            end={n.end}
                            style={({ isActive }) => ({
                                display: 'block',
                                padding: '0.7rem 1.5rem',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                background: isActive ? 'rgba(255,255,255,0.12)' : 'transparent',
                                borderLeft: isActive ? '3px solid #c4b5fd' : '3px solid transparent',
                                paddingLeft: 'calc(1.5rem - 3px)',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 700 : 500,
                                textDecoration: 'none',
                            })}
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{user?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.2rem 0 0.6rem' }}>PARENT</div>
                    <button onClick={handleLogout} style={{ width: '100%', padding: '0.4rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer' }}>
                        Logout
                    </button>
                </div>
            </aside>
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}