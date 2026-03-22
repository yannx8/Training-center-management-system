import { useEffect, useState } from 'react';
import { Search, Filter, Pencil } from 'lucide-react';
import { secretaryApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, SectionHeader, Badge, ErrorAlert } from '../../components/ui';
import { useTranslation } from 'react-i18next';

export default function AllStudents() {
  const { t } = useTranslation();
  const [students, setStudents]   = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [certs, setCerts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [filterProgram, setFilterProgram] = useState('');
  const [filterCert, setFilterCert]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('');
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  function load() {
    const params = {};
    if (filterProgram) params.programId = filterProgram;
    if (filterCert)    params.certificationId = filterCert;
    if (filterStatus)  params.status = filterStatus;
    Promise.all([
      secretaryApi.getStudents(params),
      secretaryApi.getPrograms(),
      secretaryApi.getCertifications(),
    ]).then(([s, p, c]) => {
      setStudents(s.data || []);
      setPrograms(p.data || []);
      setCerts(c.data || []);
      setLoading(false);
    }).catch(() => setError(t('common.failedLoad','Failed to load students')));
  }
  useEffect(() => { setLoading(true); load(); }, [filterProgram, filterCert, filterStatus]);

  const filtered = search
    ? students.filter(s =>
        s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        s.matricule?.toLowerCase().includes(search.toLowerCase()))
    : students;

  async function handleUpdate() {
    setSaving(true);
    try {
      await secretaryApi.updateStudent(editModal.id, editForm);
      setEditModal(null); load();
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave','Update failed')); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={t('secretary.allStudentsTitle','All Students')}
        subtitle={t('secretary.allStudentsSubtitle','{{filtered}} of {{total}} students', { filtered: filtered.length, total: students.length })}
      />
      {error && <ErrorAlert message={error} />}

      {/* Search + Filters */}
      <div className="card p-4 space-y-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input
            className="input pl-9"
            placeholder={t('secretary.searchPlaceholder','Search name or matricule…')}
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-gray-400 flex-shrink-0"/>
          <select className="select flex-1 min-w-[140px] text-sm" value={filterProgram} onChange={e => { setFilterProgram(e.target.value); setFilterCert(''); }}>
            <option value="">{t('secretary.allPrograms','All Programs')}</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select flex-1 min-w-[140px] text-sm" value={filterCert} onChange={e => { setFilterCert(e.target.value); setFilterProgram(''); }}>
            <option value="">{t('secretary.allCerts','All Certs')}</option>
            {certs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select flex-1 min-w-[120px] text-sm" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option value="">{t('secretary.allStatus','All Status')}</option>
            <option value="active">{t('common.active','Active')}</option>
            <option value="inactive">{t('common.inactive','Inactive')}</option>
          </select>
        </div>
      </div>

      {/* Mobile-friendly card list */}
      {filtered.length === 0 && (
        <div className="card p-10 text-center text-gray-400">{t('common.noData','No data available.')}</div>
      )}

      <div className="space-y-2">
        {filtered.map(s => (
          <div key={s.id} className="card px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700 text-xs font-bold">
              {s.user?.fullName?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{s.user?.fullName}</p>
              <p className="text-xs text-gray-400">{s.matricule} · {s.program?.name || s.enrollments?.find(e=>e.certification)?.certification?.name || '—'}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge value={s.user?.status || 'active'} />
              <button
                className="btn-ghost btn-sm btn-icon"
                title={t('secretary.editStudent','Edit')}
                onClick={() => { setEditModal(s); setEditForm({ fullName: s.user?.fullName, phone: s.user?.phone, status: s.user?.status }); }}
              >
                <Pencil size={14}/>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit modal */}
      <Modal
        open={!!editModal}
        onClose={() => setEditModal(null)}
        title={t('secretary.editStudent','Edit Student')}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditModal(null)}>{t('common.cancel','Cancel')}</button>
            <button className="btn-primary" onClick={handleUpdate} disabled={saving}>
              {saving ? t('common.saving','Saving…') : t('common.save','Save')}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            {t('secretary.editStudentNote','⚠ Secretaries can update student data but cannot delete students.')}
          </p>
          <div>
            <label className="label">{t('userManagement.fullName','Full Name')}</label>
            <input className="input" value={editForm.fullName||''} onChange={e=>setEditForm(f=>({...f,fullName:e.target.value}))}/>
          </div>
          <div>
            <label className="label">{t('userManagement.phone','Phone')}</label>
            <input className="input" value={editForm.phone||''} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/>
          </div>
          <div>
            <label className="label">{t('common.status','Status')}</label>
            <select className="select" value={editForm.status||'active'} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}>
              <option value="active">{t('common.active','Active')}</option>
              <option value="inactive">{t('common.inactive','Inactive')}</option>
            </select>
          </div>
        </div>
      </Modal>
    </div>
  );
}
