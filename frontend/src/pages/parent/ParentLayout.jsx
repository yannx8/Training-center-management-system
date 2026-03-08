// FILE: /frontend/src/pages/parent/ParentLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
    { to: '/parent',               label: '👨‍👩‍👧 My Children',    end: true },
    { to: '/parent/announcements', label: '📢 Announcements',  end: false },
    { to: '/parent/complaints',    label: '💬 Complaints',      end: false },
];

export default function ParentLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    function handleLogout() { logout(); navigate('/login'); }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            <aside style={{
                width: 240, background: '#1e3a5f', color: '#fff',
                display: 'flex', flexDirection: 'column', padding: '1.5rem 0',
            }}>
                <div style={{ fontWeight: 700, fontSize: '1.1rem', padding: '0 1.25rem', marginBottom: '2rem' }}>
                    Parent Portal
                </div>
                <nav style={{ flex: 1 }}>
                    {NAV.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.end}
                            style={({ isActive }) => ({
                                display: 'block', padding: '0.65rem 1.25rem',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                                textDecoration: 'none', fontWeight: isActive ? 600 : 400,
                                borderLeft: isActive ? '3px solid #fff' : '3px solid transparent',
                                transition: 'all 0.15s',
                            })}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{user?.fullName || 'Parent'}</div>
                    <button
                        onClick={handleLogout}
                        style={{ marginTop: '0.5rem', background: 'rgba(255,255,255,0.15)', color: '#fff', border: 'none', borderRadius: 6, padding: '0.4rem 0.8rem', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
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
