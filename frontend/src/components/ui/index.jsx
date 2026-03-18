// FILE: src/components/ui/index.jsx
// Barrel of small shared UI components

import { Loader2, AlertTriangle } from 'lucide-react';

// ─── Spinner ─────────────────────────────────────────────────
export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-primary-500 ${className}`} />;
}

// ─── Loading Page ─────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size={32} />
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────
export function StatCard({ icon, label, value, color = 'bg-primary-100 text-primary-600', trend }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
        {trend && <p className="text-xs text-gray-400 mt-1">{trend}</p>}
      </div>
    </div>
  );
}

// ─── Badge ───────────────────────────────────────────────────
const BADGE_MAP = {
  active: 'badge-green', published: 'badge-green', present: 'badge-green', resolved: 'badge-green',
  inactive: 'badge-gray', draft: 'badge-yellow', pending: 'badge-yellow',
  in_progress: 'badge-blue', scheduled: 'badge-blue',
  absent: 'badge-red', late: 'badge-yellow',
  high: 'badge-red', medium: 'badge-yellow', low: 'badge-blue',
};

export function Badge({ value, label }) {
  const cls = BADGE_MAP[value] || 'badge-gray';
  return <span className={cls}>{label || value}</span>;
}

// ─── Empty State ──────────────────────────────────────────────
export function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && <div className="text-gray-300 mb-4">{icon}</div>}
      <p className="text-base font-semibold text-gray-500">{title}</p>
      {description && <p className="text-sm text-gray-400 mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ─── Error Alert ─────────────────────────────────────────────
export function ErrorAlert({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
      <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ─── Confirm Modal ───────────────────────────────────────────
import Modal from './Modal';

export function ConfirmModal({ open, onClose, onConfirm, title = 'Confirm Action', message, loading }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? <Spinner size={14} /> : 'Confirm'}
          </button>
        </>
      }
    >
      <p className="text-gray-600 text-sm">{message}</p>
    </Modal>
  );
}

// ─── Section Header ───────────────────────────────────────────
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="page-header">
      <div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}
