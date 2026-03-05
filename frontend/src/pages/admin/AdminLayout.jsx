import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV = [
    { to: '/admin',                  label: 'Dashboard',       end: true  },
    { to: '/admin/users',            label: ' Users',            end: false },
    { to: '/admin/departments',      label: ' Departments',      end: false },
    { to: '/admin/programs',         label: ' Programs',         end: false },
    { to: '/admin/academic-years',   label: ' Academic Years',   end: false },
    { to: '/admin/rooms',            label: ' Rooms',            end: false },
    { to: '/admin/complaints',       label: ' Complaints',       end: false },
];

const BRAND_COLOR = '#1a1a2e';  

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() { logout(); navigate('/login'); }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            {/* Sidebar */}
            <aside style={{
                width: 230,
                minWidth: 230,
                background: BRAND_COLOR,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                position: 'sticky',
                top: 0,
            }}>
                {/* Brand */}
                <div style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                   Training center system
                </div>

                {/* Nav */}
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
                                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderLeft: isActive ? '3px solid #4f8ef7' : '3px solid transparent',
                                paddingLeft: 'calc(1.5rem - 3px)',
                                fontSize: '0.875rem',
                                fontWeight: isActive ? 700 : 500,
                                textDecoration: 'none',
                                transition: 'background 0.15s, color 0.15s',
                            })}
                        >
                            {n.label}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{user?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.2rem 0 0.6rem' }}>
                        ADMINISTRATOR
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{ width: '100%', padding: '0.4rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer' }}
                    >
                        Logout
                    </button>
                </div>
            </aside>

            {/* Main */}
            <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                <Outlet />
            </main>
        </div>
    );
}