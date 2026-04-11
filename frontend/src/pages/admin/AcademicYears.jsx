import { useEffect, useState } from 'react';
import { Plus, Star, CalendarRange, CheckCircle2 } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, SectionHeader, ErrorAlert, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EMPTY = {
  name: '',
  startDate: '',
  endDate: '',
  isActive: false,
  programId: '',
  certificationId: '',
};

export default function AcademicYears() {
  const { t } = useTranslation();
  const [years, setYears]       = useState([]);
  const [programs, setPrograms] = useState([]);
  const [certs, setCerts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [modal, setModal]       = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [activating, setActivating] = useState(null); // id of year being activated

  function load() {
    Promise.all([
      adminApi.getAcademicYears(),
      adminApi.getPrograms(),
      adminApi.getCertifications(),
    ])
      .then(([y, p, c]) => {
        setYears(y.data || []);
        setPrograms(p.data || []);
        setCerts(c.data || []);
        setLoading(false);
      })
      .catch(() => setError(t('common.failedLoad', 'Failed to load')));
  }

  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      await adminApi.createAcademicYear(form);
      setModal(false);
      load();
    } catch (e) {
      alert(e.response?.data?.message || t('common.failedSave', 'Failed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(id) {
    setActivating(id);
    try {
      await adminApi.setActiveAcademicYear(id);
      load();
    } catch (e) {
      alert(e.response?.data?.message || t('common.failedSave', 'Failed to set active year'));
    } finally {
      setActivating(null);
    }
  }

  const active   = years.filter(y => y.isActive);
  const inactive = years.filter(y => !y.isActive);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('academicYears.title', 'Academic Years')}
        subtitle={t('academicYears.subtitle', '{{count}} academic years configured', { count: years.length })}
      >
        <button
          className="btn-primary"
          onClick={() => { setForm(EMPTY); setModal(true); }}
        >
          <Plus size={16} /> {t('academicYears.addAcademicYear', 'Add Academic Year')}
        </button>
      </SectionHeader>

      {years.length === 0 && (
        <div className="card p-10 text-center text-gray-400">
          {t('academicYears.noYears', 'No academic years configured yet.')}
        </div>
      )}

      {/* Active years */}
      {active.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1 flex items-center gap-1.5">
            <Star size={12} className="text-amber-500" />
            {t('academicYears.active', 'Active')}
          </h2>
          <div className="space-y-2">
            {active.map(y => (
              <YearCard key={y.id} y={y} t={t} />
            ))}
          </div>
        </div>
      )}

      {/* Inactive years */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-1">
            {t('academicYears.total', 'All Years')}
          </h2>
          <div className="space-y-2">
            {inactive.map(y => (
              <YearCard
                key={y.id}
                y={y}
                t={t}
                onSetActive={() => handleSetActive(y.id)}
                activating={activating === y.id}
              />
            ))}
          </div>
        </div>
      )}

      {/* Add Academic Year Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title={t('academicYears.addAcademicYear', 'Add Academic Year')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setModal(false)}>
              {t('common.cancel', 'Cancel')}
            </button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="label">{t('academicYears.yearName', 'Year Name *')}</label>
            <input
              className="input"
              placeholder={t('academicYears.yearNamePlaceholder', 'e.g. 2025-2026')}
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">{t('academicYears.startDate', 'Start Date *')}</label>
              <input
                type="date"
                className="input"
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="label">{t('academicYears.endDate', 'End Date *')}</label>
              <input
                type="date"
                className="input"
                value={form.endDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="label">{t('academicYears.linkedProgram', 'Linked to Program (optional)')}</label>
            <select
              className="select"
              value={form.programId}
              onChange={e => setForm(f => ({ ...f, programId: e.target.value }))}
            >
              <option value="">{t('academicYears.notLinkedProgram', '— Not linked to a program —')}</option>
              {programs.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="label">{t('academicYears.linkedCert', 'Linked to Certification (optional)')}</label>
            <select
              className="select"
              value={form.certificationId}
              onChange={e => setForm(f => ({ ...f, certificationId: e.target.value }))}
            >
              <option value="">{t('academicYears.notLinkedCert', '— Not linked to a certification —')}</option>
              {certs.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
            />
            <span className="text-sm text-gray-700">
              {t('academicYears.setActive', 'Set as active academic year')}
            </span>
          </label>

          {form.isActive && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
              ⚠ {t(
                'academicYears.activeWarning',
                'Setting this year as active will automatically deactivate the current active year.'
              )}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

function YearCard({ y, t, onSetActive, activating }) {
  return (
    <div className={`card px-4 py-3 flex items-center gap-3 ${y.isActive ? 'border-amber-300 bg-amber-50/30' : ''}`}>
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${y.isActive ? 'bg-amber-100' : 'bg-gray-100'}`}>
        <CalendarRange size={16} className={y.isActive ? 'text-amber-600' : 'text-gray-400'} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-gray-900">{y.name}</p>
          {y.isActive && <Star size={13} className="text-amber-500 fill-amber-500" />}
        </div>
        <p className="text-xs text-gray-400">
          {new Date(y.startDate).toLocaleDateString()} – {new Date(y.endDate).toLocaleDateString()}
          {y.program?.name      && ` · ${y.program.name}`}
          {y.certification?.name && ` · ${y.certification.name}`}
        </p>
      </div>

      {/* Badge / Action */}
      {y.isActive ? (
        <span className="badge-yellow text-xs flex items-center gap-1">
          <CheckCircle2 size={11} />
          {t('academicYears.active', 'Active')}
        </span>
      ) : onSetActive ? (
        <button
          className="btn-secondary btn-sm text-xs flex items-center gap-1.5"
          onClick={onSetActive}
          disabled={activating}
          title={t('academicYears.setActive', 'Set as active academic year')}
        >
          <Star size={12} />
          {activating
            ? t('common.saving', 'Saving…')
            : t('academicYears.setActive', 'Set Active')}
        </button>
      ) : null}
    </div>
  );
}