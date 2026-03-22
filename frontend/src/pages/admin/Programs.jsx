import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronRight, ArrowLeft } from 'lucide-react';
import { adminApi } from '../../api';
import Modal from '../../components/ui/Modal';
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from '../../components/ui';

const EP  = { name: '', code: '', departmentId: '', durationYears: 3, status: 'active', capacity: '' };
const EL  = { name: '', levelOrder: 1 };
const ES  = { name: '', semesterOrder: 1 };
const EC  = { name: '', code: '', credits: 3, hoursPerWeek: 2 };

export default function Programs() {
  const [depts, setDepts]         = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // ── breadcrumb / view state ──────────────────────────────────
  const [view, setView]       = useState('list'); // list | levels | semesters | courses
  const [selProg, setSelProg] = useState(null);
  const [selLevel, setSelLevel] = useState(null);
  const [selSem, setSelSem]   = useState(null);
  const [levels, setLevels]   = useState([]);
  const [courses, setCourses] = useState([]);

  // ── modal state ──────────────────────────────────────────────
  const [modal, setModal]     = useState(null); // 'program'|'level'|'semester'|'course'
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState({});
  const [saving, setSaving]   = useState(false);
  const [delId, setDelId]     = useState(null);
  const [delType, setDelType] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selTrainer, setSelTrainer]   = useState('');

  function loadAll() {
    Promise.all([
      adminApi.getDepartments(),
      adminApi.getPrograms(),
      adminApi.getSemesters(),
      adminApi.getAllTrainers(),
    ]).then(([d, p, s, t]) => {
      setDepts(d.data);
      setPrograms(p.data);
      setSemesters(s.data);
      setAllTrainers(t.data);
      setLoading(false);
    }).catch(() => setError('Failed to load data'));
  }
  useEffect(loadAll, []);

  const visiblePrograms = deptFilter
    ? programs.filter(p => String(p.departmentId) === String(deptFilter))
    : programs;

  async function loadLevels(pid) {
    const r = await adminApi.getAcademicLevels({ programId: pid });
    setLevels(r.data || []);
  }

  async function loadCourses(pid, lid, sid) {
    // ensure a session record exists linking program+level+semester
    await adminApi.createSession({ programId: pid, academicLevelId: lid, semesterId: sid });
    const data = await adminApi.getProgramCourses(pid);
    const sess = data.data?.sessions?.find(
      s => s.academicLevelId === lid && s.semesterId === sid
    );
    setCourses(sess?.courses || []);
  }

  // ── navigation ───────────────────────────────────────────────
  async function openProgram(prog) {
    setSelProg(prog);
    await loadLevels(prog.id);
    setView('levels');
  }
  function openLevel(lv) {
    setSelLevel(lv);
    setView('semesters');
  }
  async function openSemester(sem) {
    setSelSem(sem);
    await loadCourses(selProg.id, selLevel.id, sem.id);
    setView('courses');
  }

  // Breadcrumb navigation — clicking a crumb goes back to that view
  function goToView(target) {
    if (target === 'list') {
      setView('list');
      setSelProg(null); setSelLevel(null); setSelSem(null);
    } else if (target === 'levels') {
      setView('levels');
      setSelLevel(null); setSelSem(null);
    } else if (target === 'semesters') {
      setView('semesters');
      setSelSem(null);
    }
  }

  // ── save handler ─────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    try {
      if (modal === 'program') {
        if (editing) await adminApi.updateProgram(editing.id, form);
        else         await adminApi.createProgram(form);
        setModal(null); loadAll();

      } else if (modal === 'level') {
        if (editing) await adminApi.updateAcademicLevel(editing.id, form);
        else         await adminApi.createAcademicLevel({ ...form, programId: selProg.id });
        setModal(null); await loadLevels(selProg.id);

      } else if (modal === 'semester') {
        // Semesters are global (shared across all programs)
        if (editing) await adminApi.updateSemester(editing.id, form);
        else         await adminApi.createSemester(form);
        setModal(null); loadAll(); // reload semesters

      } else if (modal === 'course') {
        const sessR = await adminApi.createSession({
          programId: selProg.id,
          academicLevelId: selLevel.id,
          semesterId: selSem.id,
        });
        if (editing) await adminApi.updateCourse(editing.id, form);
        else         await adminApi.createCourse({ ...form, sessionId: sessR.data.id });
        setModal(null);
        await loadCourses(selProg.id, selLevel.id, selSem.id);
      }
    } catch (e) { alert(e.response?.data?.message || 'Save failed'); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    try {
      if (delType === 'program')  { await adminApi.deleteProgram(delId); loadAll(); }
      if (delType === 'level')    { await adminApi.deleteAcademicLevel(delId); await loadLevels(selProg.id); }
      if (delType === 'semester') { await adminApi.deleteSemester(delId); loadAll(); }
      if (delType === 'course')   { await adminApi.deleteCourse(delId); await loadCourses(selProg.id, selLevel.id, selSem.id); }
      setDelId(null);
    } catch (e) { alert(e.response?.data?.message || 'Delete failed'); }
  }

  async function handleAssignTrainer() {
    await adminApi.assignTrainer(assignModal.courseId, { trainerId: selTrainer || null });
    setAssignModal(null);
    await loadCourses(selProg.id, selLevel.id, selSem.id);
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">

      {/* ── PROGRAM LIST ── */}
      {view === 'list' && (
        <>
          <SectionHeader title="Academic Programs" subtitle="Click Manage Courses to drill into a program's structure">
            <button className="btn-primary" onClick={() => { setForm(EP); setEditing(null); setModal('program'); }}>
              <Plus size={16}/> Add Program
            </button>
          </SectionHeader>

          <div className="card p-4 flex items-center gap-3">
            <label className="text-sm font-medium text-gray-600 whitespace-nowrap">Department:</label>
            <select className="select flex-1 max-w-xs" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            {deptFilter && (
              <button className="text-xs text-gray-400 hover:text-gray-600" onClick={() => setDeptFilter('')}>Clear</button>
            )}
          </div>

          <div className="card">
            <div className="divide-y divide-gray-50">
              {visiblePrograms.length === 0 && (
                <p className="px-5 py-8 text-sm text-gray-400 text-center">No programs found.</p>
              )}
              {visiblePrograms.map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{p.name}</p>
                    <p className="text-xs text-gray-400">{p.code} · {p.durationYears}yr · {p.department?.name || '—'}</p>
                  </div>
                  {p.capacity && <span className="text-xs text-gray-500">{p._count?.enrollments || 0}/{p.capacity}</span>}
                  <Badge value={p.status}/>
                  <button className="btn-secondary btn-sm text-xs" onClick={() => openProgram(p)}>
                    Manage Courses <ChevronRight size={12}/>
                  </button>
                  <button className="btn-ghost btn-sm btn-icon" onClick={() => {
                    setForm({ name: p.name, code: p.code, departmentId: p.departmentId || '', durationYears: p.durationYears, status: p.status, capacity: p.capacity || '' });
                    setEditing(p); setModal('program');
                  }}><Pencil size={13}/></button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDelId(p.id); setDelType('program'); }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── LEVELS ── */}
      {view === 'levels' && (
        <>
          <Crumbs prog={selProg} goToView={goToView}/>
          <SectionHeader title={`${selProg?.name} — Levels`} subtitle="Each level is one academic year of this program">
            <button className="btn-primary" onClick={() => { setForm(EL); setEditing(null); setModal('level'); }}>
              <Plus size={16}/> Add Level
            </button>
          </SectionHeader>
          <div className="card">
            {levels.length === 0 && <p className="px-5 py-8 text-sm text-gray-400 text-center">No levels yet. Add Year 1, Year 2…</p>}
            <div className="divide-y divide-gray-50">
              {levels.map(lv => (
                <div key={lv.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{lv.name}</p>
                    <p className="text-xs text-gray-400">Order: {lv.levelOrder}</p>
                  </div>
                  <button className="btn-secondary btn-sm text-xs" onClick={() => openLevel(lv)}>
                    View Semesters <ChevronRight size={12}/>
                  </button>
                  <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: lv.name, levelOrder: lv.levelOrder }); setEditing(lv); setModal('level'); }}>
                    <Pencil size={13}/>
                  </button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDelId(lv.id); setDelType('level'); }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── SEMESTERS ── */}
      {view === 'semesters' && (
        <>
          <Crumbs prog={selProg} level={selLevel} goToView={goToView}/>
          <SectionHeader title={`${selLevel?.name} — Semesters`} subtitle="Global semesters — changes affect all programs using them">
            <button className="btn-primary" onClick={() => { setForm(ES); setEditing(null); setModal('semester'); }}>
              <Plus size={16}/> Add Semester
            </button>
          </SectionHeader>
          <div className="card">
            {semesters.length === 0 && <p className="px-5 py-8 text-sm text-gray-400 text-center">No semesters configured yet.</p>}
            <div className="divide-y divide-gray-50">
              {semesters.map(sem => (
                <div key={sem.id} className="px-5 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <button className="flex-1 text-left" onClick={() => openSemester(sem)}>
                    <p className="text-sm font-medium text-gray-900 hover:text-primary-600">{sem.name}</p>
                    <p className="text-xs text-gray-400">Order: {sem.semesterOrder} · Click to manage courses</p>
                  </button>
                  <ChevronRight size={14} className="text-gray-400"/>
                  <button className="btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setForm({ name: sem.name, semesterOrder: sem.semesterOrder }); setEditing(sem); setModal('semester'); }}>
                    <Pencil size={13}/>
                  </button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={e => { e.stopPropagation(); setDelId(sem.id); setDelType('semester'); }}>
                    <Trash2 size={13}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── COURSES ── */}
      {view === 'courses' && (
        <>
          <Crumbs prog={selProg} level={selLevel} sem={selSem} goToView={goToView}/>
          <SectionHeader title={`${selSem?.name} — Courses`} subtitle={`${courses.length} course(s) · ${selProg?.name}`}>
            <button className="btn-primary" onClick={() => { setForm(EC); setEditing(null); setModal('course'); }}>
              <Plus size={16}/> Add Course
            </button>
          </SectionHeader>
          <div className="card">
            {courses.length === 0 && <p className="px-5 py-8 text-sm text-gray-400 text-center">No courses yet.</p>}
            <div className="divide-y divide-gray-50">
              {courses.map(c => {
                const trainer = c.trainerCourses?.[0]?.trainer?.user;
                return (
                  <div key={c.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.code} · {c.credits}cr · {c.hoursPerWeek}h/wk</p>
                    </div>
                    {trainer
                      ? <span className="text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded font-medium">{trainer.fullName}</span>
                      : <span className="text-xs text-amber-700 bg-amber-50 px-2 py-0.5 rounded">No trainer</span>}
                    <button className="btn-ghost btn-sm text-xs text-blue-600 font-medium"
                      onClick={() => { setAssignModal({ courseId: c.id }); setSelTrainer(String(c.trainerCourses?.[0]?.trainer?.id || '')); }}>
                      Assign
                    </button>
                    <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({ name: c.name, code: c.code, credits: c.credits, hoursPerWeek: c.hoursPerWeek }); setEditing(c); setModal('course'); }}>
                      <Pencil size={13}/>
                    </button>
                    <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDelId(c.id); setDelType('course'); }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── MODALS ── */}
      <Modal open={modal === 'program'} onClose={() => setModal(null)} title={editing ? 'Edit Program' : 'New Program'}
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name||''} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Code</label><input className="input" value={form.code||''} onChange={e => setForm(f=>({...f,code:e.target.value}))}/></div>
          <div><label className="label">Department</label>
            <select className="select" value={form.departmentId||''} onChange={e => setForm(f=>({...f,departmentId:e.target.value}))}>
              <option value="">— None —</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Duration (years)</label><input type="number" min={1} max={6} className="input" value={form.durationYears||3} onChange={e => setForm(f=>({...f,durationYears:+e.target.value}))}/></div>
            <div><label className="label">Max students (optional)</label><input type="number" min={1} className="input" placeholder="No limit" value={form.capacity||''} onChange={e => setForm(f=>({...f,capacity:e.target.value}))}/></div>
          </div>
          <div><label className="label">Status</label>
            <select className="select" value={form.status||'active'} onChange={e => setForm(f=>({...f,status:e.target.value}))}>
              <option value="active">Active</option><option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <Modal open={modal === 'level'} onClose={() => setModal(null)} title={editing ? 'Edit Level' : 'Add Level'}
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Level name (e.g. Year 1, Level 2)</label><input className="input" value={form.name||''} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Order</label><input type="number" min={1} className="input" value={form.levelOrder||1} onChange={e => setForm(f=>({...f,levelOrder:+e.target.value}))}/></div>
        </div>
      </Modal>

      <Modal open={modal === 'semester'} onClose={() => setModal(null)} title={editing ? 'Edit Semester' : 'Add Semester'}
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            Semesters are global — they are shared across all programs. Editing a semester name here changes it everywhere.
          </p>
          <div><label className="label">Semester name (e.g. Semester 1, Term A)</label><input className="input" value={form.name||''} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Order</label><input type="number" min={1} className="input" value={form.semesterOrder||1} onChange={e => setForm(f=>({...f,semesterOrder:+e.target.value}))}/></div>
        </div>
      </Modal>

      <Modal open={modal === 'course'} onClose={() => setModal(null)} title={editing ? 'Edit Course' : 'Add Course'}
        footer={<><button className="btn-secondary" onClick={() => setModal(null)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Course Name</label><input className="input" value={form.name||''} onChange={e => setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Code</label><input className="input" value={form.code||''} onChange={e => setForm(f=>({...f,code:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Credits</label><input type="number" min={1} className="input" value={form.credits||3} onChange={e => setForm(f=>({...f,credits:+e.target.value}))}/></div>
            <div><label className="label">Hours/week</label><input type="number" min={1} className="input" value={form.hoursPerWeek||2} onChange={e => setForm(f=>({...f,hoursPerWeek:+e.target.value}))}/></div>
          </div>
        </div>
      </Modal>

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Trainer to Course"
        footer={<><button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button><button className="btn-primary" onClick={handleAssignTrainer}>Assign</button></>}>
        <div>
          <label className="label">Trainer</label>
          <select className="select" value={selTrainer} onChange={e => setSelTrainer(e.target.value)}>
            <option value="">— Remove trainer —</option>
            {allTrainers.map(t => <option key={t.id} value={t.id}>{t.user?.fullName} ({t.user?.department || '—'})</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmModal open={!!delId} onClose={() => setDelId(null)} onConfirm={handleDelete}
        title={`Delete ${delType}`}
        message={delType === 'semester'
          ? 'This semester is shared globally. Deleting it will remove all courses in this semester across all programs.'
          : 'This action is irreversible.'}
      />
    </div>
  );
}

// ── Clickable breadcrumb ──────────────────────────────────────────
function Crumbs({ prog, level, sem, goToView }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
      <button className="flex items-center gap-1 text-gray-400 hover:text-primary-600 transition-colors" onClick={() => goToView('list')}>
        <ArrowLeft size={13}/> Programs
      </button>
      {prog && (
        <>
          <ChevronRight size={13} className="text-gray-300"/>
          <button
            className={`font-medium transition-colors ${!level ? 'text-gray-900 cursor-default' : 'text-gray-500 hover:text-primary-600'}`}
            onClick={() => level ? goToView('levels') : undefined}
            disabled={!level}>
            {prog.name}
          </button>
        </>
      )}
      {level && (
        <>
          <ChevronRight size={13} className="text-gray-300"/>
          <button
            className={`font-medium transition-colors ${!sem ? 'text-gray-900 cursor-default' : 'text-gray-500 hover:text-primary-600'}`}
            onClick={() => sem ? goToView('semesters') : undefined}
            disabled={!sem}>
            {level.name}
          </button>
        </>
      )}
      {sem && (
        <>
          <ChevronRight size={13} className="text-gray-300"/>
          <span className="font-medium text-gray-900">{sem.name}</span>
        </>
      )}
    </nav>
  );
}
