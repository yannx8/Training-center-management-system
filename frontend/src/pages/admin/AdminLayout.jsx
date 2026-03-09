// frontend/src/pages/admin/AdminLayout.jsx
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Icon } from '../../components/Icons';

const NAV = [
    { to: '/admin',                label: 'Dashboard',     icon: 'dashboard',    end: true  },
    { to: '/admin/users',          label: 'Users',          icon: 'users',        end: false },
    { to: '/admin/departments',    label: 'Departments',    icon: 'departments',  end: false },
    { to: '/admin/programs',       label: 'Programs',       icon: 'programs',     end: false },
    { to: '/admin/academic-years', label: 'Academic Years', icon: 'calendar',     end: false },
    { to: '/admin/rooms',          label: 'Rooms',          icon: 'rooms',        end: false },
    { to: '/admin/complaints',     label: 'Complaints',     icon: 'complaint',    end: false },
];

const BRAND_COLOR = '#1a1a2e';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    function handleLogout() { logout(); navigate('/login'); }

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: '#f0f2f5' }}>
            <aside style={{
                width: 230, minWidth: 230, background: BRAND_COLOR,
                display: 'flex', flexDirection: 'column', minHeight: '100vh',
                position: 'sticky', top: 0,
            }}>
                <div style={{ padding: '1.25rem 1.5rem', fontWeight: 700, fontSize: '1rem', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    Training Center
                </div>
                <nav style={{ flex: 1, padding: '0.75rem 0' }}>
                    {NAV.map(n => (
                        <NavLink key={n.to} to={n.to} end={n.end}
                            style={({ isActive }) => ({
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.7rem 1.5rem',
                                color: isActive ? '#fff' : 'rgba(255,255,255,0.6)',
                                background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                                borderLeft: isActive ? '3px solid #4f8ef7' : '3px solid transparent',
                                paddingLeft: 'calc(1.5rem - 3px)',
                                fontSize: '0.875rem', fontWeight: isActive ? 700 : 400,
                                textDecoration: 'none', transition: 'all 0.15s',
                            })}>
                            <Icon name={n.icon} size={16} color="currentColor" />
                            {n.label}
                        </NavLink>
                    ))}
                </nav>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '1rem 1.5rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>{user?.fullName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0.2rem 0 0.6rem' }}>
                        Administrator
                    </div>
                    <button onClick={handleLogout}
                        style={{ width: '100%', padding: '0.4rem', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', borderRadius: 4, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <Icon name="logout" size={13} />
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