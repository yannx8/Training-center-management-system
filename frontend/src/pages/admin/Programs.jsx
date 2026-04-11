import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, ArrowLeft, UserCheck } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from '../../components/ui';
import { useTranslation } from 'react-i18next';

const EP = { name: '', code: '', departmentId: '', durationYears: 3, status: 'active', capacity: '' };
const EL = { name: '', levelOrder: 1 };
const ES = { name: '', semesterOrder: 1 };
const EC = { name: '', code: '', credits: 3, hoursPerWeek: 2 };

// Breadcrumb component
function Crumbs({ prog, level, sem, goToView, t }) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500 mb-1">
      <button onClick={() => goToView('list')} className="hover:text-primary-600 font-medium">{t('programs.title', 'Programs')}</button>
      {prog && <><ChevronRight size={12} /><button onClick={() => goToView('levels')} className="hover:text-primary-600">{prog.name}</button></>}
      {level && <><ChevronRight size={12} /><button onClick={() => goToView('semesters')} className="hover:text-primary-600">{level.name}</button></>}
      {sem && <><ChevronRight size={12} /><span className="text-gray-700 font-medium">{sem.name}</span></>}
    </div>
  );
}

export default function Programs() {
  const { t } = useTranslation();
  const [depts, setDepts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [view, setView] = useState('list');
  const [selProg, setSelProg] = useState(null);
  const [selLevel, setSelLevel] = useState(null);
  const [selSem, setSelSem] = useState(null);
  const [levels, setLevels] = useState([]);
  const [courses, setCourses] = useState([]);
  const [modal, setModal] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [delId, setDelId] = useState(null);
  const [delType, setDelType] = useState('');
  const [assignModal, setAssignModal] = useState(null);
  const [selTrainer, setSelTrainer] = useState('');

  function loadAll() {
    Promise.all([
      adminApi.getDepartments(),
      adminApi.getPrograms(),
      adminApi.getSemesters(),
      adminApi.getAllTrainers(),
    ]).then(([d, p, s, tr]) => {
      setDepts(d.data || []); setPrograms(p.data || []); setSemesters(s.data || []); setAllTrainers(tr.data || []);
      setLoading(false);
    }).catch(() => setError(t('common.failedLoad', 'Failed to load data')));
  }
  useEffect(loadAll, []);

  const visiblePrograms = deptFilter ? programs.filter(p => String(p.departmentId) === String(deptFilter)) : programs;

  async function loadLevels(pid) { const r = await adminApi.getAcademicLevels({ programId: pid }); setLevels(r.data || []); }
  async function loadCourses(pid, lid, sid) {
    await adminApi.createSession({ programId: pid, academicLevelId: lid, semesterId: sid });
    const data = await adminApi.getProgramCourses(pid);
    const sess = data.data?.sessions?.find(s => s.academicLevelId === lid && s.semesterId === sid);
    setCourses(sess?.courses || []);
  }

  async function openProgram(p) { setSelProg(p); await loadLevels(p.id); setView('levels'); }
  function openLevel(lv) { setSelLevel(lv); setView('semesters'); }
  async function openSemester(sem) { setSelSem(sem); await loadCourses(selProg.id, selLevel.id, sem.id); setView('courses'); }

  function goToView(target) {
    if (target === 'list') { setView('list'); setSelProg(null); setSelLevel(null); setSelSem(null); }
    if (target === 'levels') { setView('levels'); setSelLevel(null); setSelSem(null); }
    if (target === 'semesters') { setView('semesters'); setSelSem(null); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (modal === 'program') {
        editing ? await adminApi.updateProgram(editing.id, form) : await adminApi.createProgram(form);
        setModal(null); loadAll();
      } else if (modal === 'level') {
        editing ? await adminApi.updateAcademicLevel(editing.id, form) : await adminApi.createAcademicLevel({ ...form, programId: selProg.id });
        setModal(null); await loadLevels(selProg.id);
      } else if (modal === 'semester') {
        editing ? await adminApi.updateSemester(editing.id, form) : await adminApi.createSemester(form);
        setModal(null); loadAll();
      } else if (modal === 'course') {
        const sessR = await adminApi.createSession({ programId: selProg.id, academicLevelId: selLevel.id, semesterId: selSem.id });
        editing ? await adminApi.updateCourse(editing.id, form) : await adminApi.createCourse({ ...form, sessionId: sessR.data.id });
        setModal(null); await loadCourses(selProg.id, selLevel.id, selSem.id);
      }
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Save failed')); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    try {
      if (delType === 'program') { await adminApi.deleteProgram(delId); loadAll(); }
      if (delType === 'level') { await adminApi.deleteAcademicLevel(delId); await loadLevels(selProg.id); }
      if (delType === 'semester') { await adminApi.deleteSemester(delId); loadAll(); }
      if (delType === 'course') { await adminApi.deleteCourse(delId); await loadCourses(selProg.id, selLevel.id, selSem.id); }
      setDelId(null);
    } catch (e) { alert(e.response?.data?.message || t('common.failedSave', 'Delete failed')); }
  }

  async function handleAssignTrainer() {
    await adminApi.assignTrainer(assignModal.courseId, { trainerId: selTrainer || null });
    setAssignModal(null);
    await loadCourses(selProg.id, selLevel.id, selSem.id);
  }

  if (loading) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const SaveCancel = () => (
    <>
      <button className="btn-secondary" onClick={() => setModal(null)}>{t('common.cancel', 'Cancel')}</button>
      <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? t('common.saving', 'Saving…') : t('common.save', 'Save')}</button>
    </>
  );

  return (
    <div className="space-y-4">

      {/*  PROGRAM LIST  */}
      {view === 'list' && (
        <>
          <SectionHeader title={t('programs.title', 'Academic Programs')} subtitle={t('programs.subtitle', 'Manage programs, levels, semesters and courses')}>
            <button className="btn-primary" onClick={() => { setForm(EP); setEditing(null); setModal('program'); }}>
              <Plus size={16} /> {t('programs.addProgram', 'Add Program')}
            </button>
          </SectionHeader>

          <div className="card p-3 flex items-center gap-2">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">{t('programs.departmentFilter', 'Department:')}</label>
            <select className="select flex-1" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">{t('programs.allDepartments', 'All Departments')}</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {deptFilter && <button className="text-xs text-gray-400 hover:text-gray-600 whitespace-nowrap" onClick={() => setDeptFilter('')}>{t('common.clear', 'Clear')}</button>}
          </div>

          <div className="card overflow-hidden">
            {visiblePrograms.length === 0 && <p className="p-8 text-sm text-gray-400 text-center">{t('programs.noProgramsFound', 'No programs found.')}</p>}
            <div className="divide-y divide-gray-50">
              {visiblePrograms.map(p => (
                <div key={p.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.code} · {p.durationYears}yr · {p.department?.name || '—'}</p>
                  </div>
                  <Badge value={p.status} />
                  <button className="btn-secondary btn-sm" onClick={() => openProgram(p)}>
                    {t('programs.manageCourses', 'Manage')} <ChevronRight size={12} />
                  </button>
                  <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: p.name, code: p.code, departmentId: p.departmentId || '', durationYears: p.durationYears, status: p.status, capacity: p.capacity || '' }); setEditing(p); setModal('program'); }}>
                    <Pencil size={13} />
                  </button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDelId(p.id); setDelType('program'); }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/*  LEVELS  */}
      {view === 'levels' && (
        <>
          <Crumbs prog={selProg} goToView={goToView} t={t} />
          <SectionHeader title={`${selProg?.name} — ${t('programs.levels', 'Levels')}`} subtitle={t('programs.levelSubtitle', 'Each level is one academic year of this program')}>
            <button className="btn-primary" onClick={() => { setForm(EL); setEditing(null); setModal('level'); }}>
              <Plus size={16} /> {t('programs.addLevel', 'Add Level')}
            </button>
          </SectionHeader>
          <div className="card overflow-hidden">
            {levels.length === 0 && <p className="p-8 text-sm text-gray-400 text-center">{t('programs.noLevelsYet', 'No levels yet. Add Year 1, Year 2…')}</p>}
            <div className="divide-y divide-gray-50">
              {levels.map(lv => (
                <div key={lv.id} className="px-4 py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{lv.name}</p>
                    <p className="text-xs text-gray-400">{t('common.order', 'Order')}: {lv.levelOrder}</p>
                  </div>
                  <button className="btn-secondary btn-sm" onClick={() => openLevel(lv)}>
                    {t('programs.viewSemesters', 'Semesters')} <ChevronRight size={12} />
                  </button>
                  <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: lv.name, levelOrder: lv.levelOrder }); setEditing(lv); setModal('level'); }}><Pencil size={13} /></button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDelId(lv.id); setDelType('level'); }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/*  SEMESTERS  */}
      {view === 'semesters' && (
        <>
          <Crumbs prog={selProg} level={selLevel} goToView={goToView} t={t} />
          <SectionHeader title={`${selLevel?.name} — ${t('programs.semesters', 'Semesters')}`} subtitle={t('programs.semesterSubtitle', 'Global semesters — changes affect all programs')}>
            <button className="btn-primary" onClick={() => { setForm(ES); setEditing(null); setModal('semester'); }}>
              <Plus size={16} /> {t('programs.addSemester', 'Add Semester')}
            </button>
          </SectionHeader>
          <div className="card overflow-hidden">
            {semesters.length === 0 && <p className="p-8 text-sm text-gray-400 text-center">{t('programs.noSemestersYet', 'No semesters configured yet.')}</p>}
            <div className="divide-y divide-gray-50">
              {semesters.map(sem => (
                <div key={sem.id} className="px-4 py-3 flex items-center gap-3">
                  <button className="flex-1 text-left" onClick={() => openSemester(sem)}>
                    <p className="text-sm font-semibold text-gray-900 hover:text-primary-600">{sem.name}</p>
                    <p className="text-xs text-gray-400">{t('common.order', 'Order')}: {sem.semesterOrder}</p>
                  </button>
                  <button className="btn-secondary btn-sm" onClick={() => openSemester(sem)}>
                    {t('programs.courses', 'Courses')} <ChevronRight size={12} />
                  </button>
                  <button className="btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setForm({ name: sem.name, semesterOrder: sem.semesterOrder }); setEditing(sem); setModal('semester'); }}><Pencil size={13} /></button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={e => { e.stopPropagation(); setDelId(sem.id); setDelType('semester'); }}><Trash2 size={13} /></button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/*  COURSES  */}
      {view === 'courses' && (
        <>
          <Crumbs prog={selProg} level={selLevel} sem={selSem} goToView={goToView} t={t} />
          <SectionHeader title={`${selSem?.name} — ${t('programs.courses', 'Courses')}`} subtitle={`${courses.length} ${t('common.sessions', 'courses')} · ${selProg?.name}`}>
            <button className="btn-primary" onClick={() => { setForm(EC); setEditing(null); setModal('course'); }}>
              <Plus size={16} /> {t('programs.addCourse', 'Add Course')}
            </button>
          </SectionHeader>
          <div className="card overflow-hidden">
            {courses.length === 0 && <p className="p-8 text-sm text-gray-400 text-center">{t('programs.noCoursesYet', 'No courses yet.')}</p>}
            <div className="divide-y divide-gray-50">
              {courses.map(c => {
                const trainer = c.trainerCourses?.[0]?.trainer?.user;
                return (
                  <div key={c.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.code} · {c.credits}cr · {c.hoursPerWeek}h/wk</p>
                    </div>
                    {trainer
                      ? <span className="text-xs badge-green">{trainer.fullName}</span>
                      : <span className="text-xs badge-yellow">{t('programs.noTrainer', 'No trainer')}</span>}
                    <button className="btn-ghost btn-sm text-xs text-blue-600 font-medium flex items-center gap-1"
                      onClick={() => { setAssignModal({ courseId: c.id }); setSelTrainer(String(c.trainerCourses?.[0]?.trainer?.id || '')); }}>
                      <UserCheck size={13} /> {t('common.assign', 'Assign')}
                    </button>
                    <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: c.name, code: c.code, credits: c.credits, hoursPerWeek: c.hoursPerWeek }); setEditing(c); setModal('course'); }}><Pencil size={13} /></button>
                    <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDelId(c.id); setDelType('course'); }}><Trash2 size={13} /></button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/*  MODALS  */}
      <Modal open={modal === 'program'} onClose={() => setModal(null)} title={editing ? t('programs.editProgram', 'Edit Program') : t('programs.addProgram', 'New Program')} footer={<SaveCancel />}>
        <div className="space-y-4">
          <div><label className="label">{t('common.name', 'Name')}</label><input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">{t('common.code', 'Code')}</label><input className="input" value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
          <div><label className="label">{t('userManagement.department', 'Department')}</label>
            <select className="select" value={form.departmentId || ''} onChange={e => setForm(f => ({ ...f, departmentId: e.target.value }))}>
              <option value="">{t('userManagement.noneOption', '— None —')}</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('programs.duration', 'Duration (years)')}</label><input type="number" min={1} max={6} className="input" value={form.durationYears || 3} onChange={e => setForm(f => ({ ...f, durationYears: +e.target.value }))} /></div>
            <div><label className="label">{t('programs.maxStudents', 'Max students')}</label><input type="number" min={1} className="input" placeholder={t('common.noLimit', 'No limit')} value={form.capacity || ''} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} /></div>
          </div>
          <div><label className="label">{t('common.status', 'Status')}</label>
            <select className="select" value={form.status || 'active'} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              <option value="active">{t('common.active', 'Active')}</option><option value="inactive">{t('common.inactive', 'Inactive')}</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'level'} onClose={() => setModal(null)} title={editing ? t('programs.editLevel', 'Edit Level') : t('programs.addLevel', 'Add Level')} footer={<SaveCancel />}>
        <div className="space-y-4">
          <div><label className="label">{t('programs.levelName', 'Level name')}</label><input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">{t('programs.order', 'Order')}</label><input type="number" min={1} className="input" value={form.levelOrder || 1} onChange={e => setForm(f => ({ ...f, levelOrder: +e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={modal === 'semester'} onClose={() => setModal(null)} title={editing ? t('programs.editSemester', 'Edit Semester') : t('programs.addSemester', 'Add Semester')} footer={<SaveCancel />}>
        <div className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">{t('programs.semesterWarning', 'Semesters are global — editing a semester name changes it everywhere.')}</p>
          <div><label className="label">{t('programs.semesterName', 'Semester name')}</label><input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">{t('programs.order', 'Order')}</label><input type="number" min={1} className="input" value={form.semesterOrder || 1} onChange={e => setForm(f => ({ ...f, semesterOrder: +e.target.value }))} /></div>
        </div>
      </Modal>

      <Modal open={modal === 'course'} onClose={() => setModal(null)} title={editing ? t('programs.editCourse', 'Edit Course') : t('programs.addCourse', 'Add Course')} footer={<SaveCancel />}>
        <div className="space-y-4">
          <div><label className="label">{t('common.name', 'Course Name')}</label><input className="input" value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
          <div><label className="label">{t('common.code', 'Code')}</label><input className="input" value={form.code || ''} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">{t('programs.credits', 'Credits')}</label><input type="number" min={1} className="input" value={form.credits || 3} onChange={e => setForm(f => ({ ...f, credits: +e.target.value }))} /></div>
            <div><label className="label">{t('programs.hoursPerWeek', 'Hours/week')}</label><input type="number" min={1} className="input" value={form.hoursPerWeek || 2} onChange={e => setForm(f => ({ ...f, hoursPerWeek: +e.target.value }))} /></div>
          </div>
        </div>
      </Modal>

       <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title={t('programs.assignTrainer', 'Assign Trainer')}
        footer={<><button className="btn-secondary" onClick={() => setAssignModal(null)}>{t('common.cancel', 'Cancel')}</button><button className="btn-primary" onClick={handleAssignTrainer}>{t('common.assign', 'Assign')}</button></>}>
        <div>
          <label className="label">{t('programs.selectTrainer', 'Select Trainer')}</label>
          <select className="select" value={selTrainer} onChange={e => setSelTrainer(e.target.value)}>
            <option value="">{t('programs.removeTrainer', '— Remove trainer —')}</option>
            {allTrainers.map(tr => (
              <option key={tr.id} value={tr.id}>{tr.user?.fullName || '—'}</option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmModal open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title={delType === 'program' ? t('programs.deleteProgram', 'Delete Program') : delType === 'level' ? t('programs.deleteLevel', 'Delete Level') : delType === 'semester' ? t('programs.deleteSemester', 'Delete Semester') : t('programs.deleteCourse', 'Delete Course')}
        message={delType === 'semester' ? t('programs.deleteSemesterConfirm', 'This semester is shared globally. Deleting it will remove all courses in this semester across all programs.') : delType === 'course' ? t('programs.deleteCourseConfirm', 'This will permanently remove the course and all related grades.') : t('departments.deleteConfirm', 'This cannot be undone.')} />
    </div>
  );
}