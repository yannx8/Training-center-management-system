// FILE: /frontend/src/components/Badge.jsx
import '../styles/Badge.css';

const roleColors = {
  hod: 'badge-hod',
  trainer: 'badge-trainer',
  secretary: 'badge-secretary',
  admin: 'badge-admin',
  student: 'badge-student',
  parent: 'badge-parent',
};

const statusColors = {
  active: 'badge-active',
  inactive: 'badge-inactive',
  available: 'badge-active',
  occupied: 'badge-occupied',
  pending: 'badge-pending',
  in_progress: 'badge-inprogress',
  resolved: 'badge-resolved',
  high: 'badge-high',
  medium: 'badge-medium',
  low: 'badge-low',
};

export default function Badge({ label, type = 'status' }) {
  const cls = type === 'role'
    ? roleColors[label?.toLowerCase()] || 'badge-default'
    : statusColors[label?.toLowerCase()] || 'badge-default';
  return <span className={`badge ${cls}`}>{label}</span>;
}