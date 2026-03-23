import { AlertTriangle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './Modal';

// ── StatCard ─────────────────────────────────────────────────────
export function StatCard({ label, value, icon, color = 'bg-primary-100 text-primary-700' }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${color}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">{label}</p>
      </div>
    </div>
  );
}

// ── SectionHeader ────────────────────────────────────────────────
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

// ── PageLoader ───────────────────────────────────────────────────
export function PageLoader() {
  return (
    <div className="flex items-center justify-center py-16">
      <Loader2 size={28} className="animate-spin text-primary-400" />
    </div>
  );
}

// ── ErrorAlert ───────────────────────────────────────────────────
export function ErrorAlert({ message }) {
  return (
    <div className="card p-4 bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
      <AlertTriangle size={16} className="flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

// ── Badge ────────────────────────────────────────────────────────
export function Badge({ value, label }) {
  const { t } = useTranslation();

  const BADGE_MAP = {
    active:      'badge-green',
    inactive:    'badge-red',
    published:   'badge-green',
    draft:       'badge-gray',
    pending:     'badge-yellow',
    reviewed:    'badge-blue',
    resolved:    'badge-green',
    in_progress: 'badge-blue',
    available:   'badge-green',
    unavailable: 'badge-red',
    high:        'badge-red',
    medium:      'badge-yellow',
    low:         'badge-gray',
  };

  const LABEL_KEYS = {
    active:      'common.active',
    inactive:    'common.inactive',
    published:   'common.published',
    draft:       'common.draft',
    pending:     'common.pending',
    reviewed:    'common.reviewed',
    resolved:    'common.resolved',
    in_progress: 'common.in_progress',
    available:   'common.active',
    unavailable: 'common.inactive',
    high:        'common.high',
    medium:      'common.medium',
    low:         'common.low',
  };

  const key = String(value || '').toLowerCase();
  const cls = BADGE_MAP[key] || 'badge-gray';
  const displayLabel = label || (LABEL_KEYS[key] ? t(LABEL_KEYS[key], value) : value);

  return <span className={cls}>{displayLabel}</span>;
}

// ── ConfirmModal ─────────────────────────────────────────────────
export function ConfirmModal({ open, onClose, onConfirm, title, message }) {
  const { t } = useTranslation();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title || t('common.confirm','Confirm')}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>{t('common.cancel','Cancel')}</button>
          <button
            className="btn-danger"
            onClick={async () => { await onConfirm(); onClose(); }}
          >
            {t('common.delete','Delete')}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">{message || t('common.confirm','Are you sure?')}</p>
    </Modal>
  );
}