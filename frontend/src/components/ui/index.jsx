// Re-exports + shared UI components — fully i18n-aware, mobile-friendly
import { useTranslation } from 'react-i18next';

export { default as Modal }         from './Modal';
export { default as Table }         from './Table';
export { default as TimetableGrid } from './TimetableGrid';

// ── Badge ────────────────────────────────────────────────────────────────────
export function Badge({ value, label }) {
  const v    = value?.toLowerCase() || '';
  const text = label || value;
  if (v === 'active' || v === 'resolved' || v === 'a' || v === 'a+')
    return <span className="badge-green capitalize">{text}</span>;
  if (v === 'inactive' || v === 'f' || v === 'failed')
    return <span className="badge-red capitalize">{text}</span>;
  if (v === 'pending' || v === 'd')
    return <span className="badge-yellow capitalize">{text}</span>;
  if (v === 'in_progress' || v === 'published' || v === 'b')
    return <span className="badge-blue capitalize">{text?.replace('_', ' ')}</span>;
  if (v === 'admin' || v === 'hod')
    return <span className="badge-purple capitalize">{text}</span>;
  if (v === 'trainer' || v === 'c')
    return <span className="badge-green capitalize">{text}</span>;
  if (v === 'parent')
    return <span className="badge-blue capitalize">{text}</span>;
  return <span className="badge-gray capitalize">{text?.replace('_', ' ')}</span>;
}

// ── PageLoader ───────────────────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"/>
    </div>
  );
}

// ── ErrorAlert ───────────────────────────────────────────────────────────────
export function ErrorAlert({ message }) {
  return (
    <div className="card p-4 border-l-4 border-l-red-500 bg-red-50 text-red-800 text-sm">
      {message}
    </div>
  );
}

// ── SectionHeader ────────────────────────────────────────────────────────────
export function SectionHeader({ title, subtitle, children }) {
  return (
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div className="min-w-0">
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-2 flex-wrap flex-shrink-0">{children}</div>}
    </div>
  );
}

// ── ConfirmModal ─────────────────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  const { t } = useTranslation();
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-box max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="modal-body">
          <p className="text-sm text-gray-600">{message}</p>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel', 'Cancel')}</button>
          <button className="btn-danger" onClick={() => { onConfirm(); onClose(); }}>{t('common.delete', 'Delete')}</button>
        </div>
      </div>
    </div>
  );
}

// ── StatCard ─────────────────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'bg-primary-100 text-primary-700' }) {
  return (
    <div className="stat-card">
      {icon && <div className={`stat-icon ${color}`}>{icon}</div>}
      <div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
}
