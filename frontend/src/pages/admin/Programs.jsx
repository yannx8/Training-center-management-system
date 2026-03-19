// FILE: src/pages/admin/Programs.jsx
// Hierarchical navigation: Programs → Levels (Years) → Semesters → Courses
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight, BookOpen, ArrowLeft } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY_PROG = { name:"", code:"", departmentId:"", durationYears:3, status:"active", capacity:"" };
const EMPTY_LEVEL = { name:"", levelOrder:1 };
const EMPTY_COURSE = { name:"", code:"", credits:3, hoursPerWeek:2 };

export default function Programs() {
  const [view, setView]         = useState("programs"); // "programs" | "levels" | "semesters" | "courses"
  const [programs, setPrograms] = useState([]);
  const [depts, setDepts]       = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [allTrainers, setAllTrainers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  // Navigation state
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedLevel, setSelectedLevel]     = useState(null);
  const [selectedSemester, setSelectedSemester] = useState(null);
  const [levels, setLevels]     = useState([]);
  const [courses, setCourses]   = useState([]);
  // Modals
  const [modal, setModal]       = useState(null); // "program" | "level" | "course"
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState({});
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [deleteType, setDeleteType] = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selTrainer, setSelTrainer]   = useState("");

  function load() {
    Promise.all([adminApi.getPrograms(), adminApi.getDepartments(), adminApi.getSemesters(), adminApi.getAllTrainers()])
      .then(([p,d,s,t]) => { setPrograms(p.grouped||[]); setDepts(d.data); setSemesters(s.data); setAllTrainers(t.data); setLoading(false); })
      .catch(() => setError("Failed to load"));
  }
  useEffect(load, []);

  async function loadLevels(programId) {
    const r = await adminApi.getAcademicLevels({ programId });
    setLevels(r.data || []);
  }

  async function loadCourses(programId, levelId, semesterId) {
    // find or create session, then get courses
    const sessR = await adminApi.createSession({ programId, academicLevelId:levelId, semesterId });
    const session = sessR.data;
    const pTree = await adminApi.getProgramCourses(programId);
    const sess = pTree.data?.sessions?.find(s => s.academicLevelId === levelId && s.semesterId === semesterId);
    setCourses(sess?.courses || []);
    return session;
  }

  // Navigate down
  async function openProgram(prog) {
    setSelectedProgram(prog);
    await loadLevels(prog.id);
    setView("levels");
  }

  async function openLevel(level) {
    setSelectedLevel(level);
    setView("semesters");
  }

  async function openSemester(sem) {
    setSelectedSemester(sem);
    await loadCourses(selectedProgram.id, selectedLevel.id, sem.id);
    setView("courses");
  }

  // Navigate back
  function goBack() {
    if (view === "courses")   { setView("semesters"); setSelectedSemester(null); }
    else if (view === "semesters") { setView("levels"); setSelectedLevel(null); }
    else if (view === "levels")    { setView("programs"); setSelectedProgram(null); setLevels([]); }
  }

  // Save program
  async function saveProgram() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateProgram(editing.id, form);
      else         await adminApi.createProgram(form);
      setModal(null); load();
    } catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  // Save level
  async function saveLevel() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateAcademicLevel(editing.id, form);
      else         await adminApi.createAcademicLevel({ ...form, programId:selectedProgram.id });
      setModal(null); await loadLevels(selectedProgram.id);
    } catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  // Save course
  async function saveCourse() {
    setSaving(true);
    try {
      // Ensure session exists
      const sessR = await adminApi.createSession({ programId:selectedProgram.id, academicLevelId:selectedLevel.id, semesterId:selectedSemester.id });
      if (editing) await adminApi.updateCourse(editing.id, form);
      else         await adminApi.createCourse({ ...form, sessionId:sessR.data.id });
      setModal(null);
      await loadCourses(selectedProgram.id, selectedLevel.id, selectedSemester.id);
    } catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  // Assign trainer to course
  async function handleAssignTrainer() {
    await adminApi.assignTrainer(assignModal.courseId, { trainerId:selTrainer||null });
    setAssignModal(null);
    await loadCourses(selectedProgram.id, selectedLevel.id, selectedSemester.id);
  }

  // Delete dispatcher
  async function handleDelete() {
    try {
      if (deleteType === "program")  await adminApi.deleteProgram(deleteId);
      if (deleteType === "level")    await adminApi.deleteAcademicLevel(deleteId);
      if (deleteType === "course")   await adminApi.deleteCourse(deleteId);
      setDeleteId(null);
      if (deleteType === "program") load();
      if (deleteType === "level")   await loadLevels(selectedProgram.id);
      if (deleteType === "course")  await loadCourses(selectedProgram.id, selectedLevel.id, selectedSemester.id);
    } catch(e) { alert(e.response?.data?.message||"Failed to delete"); }
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  // ── Breadcrumb ───────────────────────────────────────────────────
  const Breadcrumb = () => (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
      <button className="hover:text-primary-600" onClick={() => { setView("programs"); setSelectedProgram(null); setSelectedLevel(null); setSelectedSemester(null); }}>Programs</button>
      {selectedProgram && <><ChevronRight size={14}/><button className="hover:text-primary-600" onClick={() => { setView("levels"); setSelectedLevel(null); setSelectedSemester(null); }}>{selectedProgram.name}</button></>}
      {selectedLevel && <><ChevronRight size={14}/><button className="hover:text-primary-600" onClick={() => { setView("semesters"); setSelectedSemester(null); }}>{selectedLevel.name}</button></>}
      {selectedSemester && <><ChevronRight size={14}/><span className="text-gray-800 font-medium">{selectedSemester.name}</span></>}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* ── PROGRAMS VIEW ── */}
      {view === "programs" && (
        <>
          <SectionHeader title="Academic Programs" subtitle="Grouped by department. Click a program to manage its levels and courses.">
            <button className="btn-primary" onClick={() => { setForm(EMPTY_PROG); setEditing(null); setModal("program"); }}><Plus size={16}/> Add Program</button>
          </SectionHeader>
          {programs.map(group => (
            <div key={group.department?.name||"none"} className="space-y-2">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">{group.department?.name||"No Department"}</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.programs.map(p => (
                  <div key={p.id} className="card p-4 flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <div><p className="font-semibold text-gray-900 text-sm">{p.name}</p><p className="text-xs text-gray-400">{p.code} · {p.durationYears}yr</p></div>
                      <Badge value={p.status}/>
                    </div>
                    <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                      <button className="btn-secondary btn-sm flex-1 justify-center text-xs" onClick={() => openProgram(p)}>
                        <BookOpen size={12}/> Manage Courses <ChevronRight size={12}/>
                      </button>
                      <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:p.name,code:p.code,departmentId:p.departmentId||"",durationYears:p.durationYears,status:p.status,capacity:p.capacity||""}); setEditing(p); setModal("program"); }}><Pencil size={13}/></button>
                      <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDeleteId(p.id); setDeleteType("program"); }}><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── LEVELS VIEW ── */}
      {view === "levels" && (
        <>
          <Breadcrumb/>
          <SectionHeader title={`${selectedProgram?.name} — Academic Levels`} subtitle="Click a level to see its semesters">
            <button className="btn-primary" onClick={() => { setForm({...EMPTY_LEVEL}); setEditing(null); setModal("level"); }}><Plus size={16}/> Add Level</button>
          </SectionHeader>
          {levels.length === 0 && <div className="card p-8 text-center text-gray-400">No levels configured. Add Year 1, Year 2… etc.</div>}
          <div className="grid md:grid-cols-3 gap-3">
            {levels.map(level => (
              <div key={level.id} className="card-hover p-5 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-gray-900">{level.name}</p>
                  <div className="flex gap-1">
                    <button className="btn-ghost btn-sm btn-icon" onClick={e => { e.stopPropagation(); setForm({name:level.name,levelOrder:level.levelOrder}); setEditing(level); setModal("level"); }}><Pencil size={13}/></button>
                    <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={e => { e.stopPropagation(); setDeleteId(level.id); setDeleteType("level"); }}><Trash2 size={13}/></button>
                  </div>
                </div>
                <button className="btn-secondary btn-sm justify-center" onClick={() => openLevel(level)}>
                  View Semesters <ChevronRight size={13}/>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── SEMESTERS VIEW ── */}
      {view === "semesters" && (
        <>
          <Breadcrumb/>
          <SectionHeader title={`${selectedLevel?.name} — Semesters`} subtitle="Click a semester to view and manage its courses"/>
          <div className="grid md:grid-cols-2 gap-3">
            {semesters.map(sem => (
              <button key={sem.id} className="card-hover p-5 text-left" onClick={() => openSemester(sem)}>
                <p className="font-semibold text-gray-900">{sem.name}</p>
                <p className="text-xs text-gray-400 mt-1">Click to view courses <ChevronRight size={12} className="inline"/></p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── COURSES VIEW ── */}
      {view === "courses" && (
        <>
          <Breadcrumb/>
          <SectionHeader title={`${selectedSemester?.name} — Courses`} subtitle={`${courses.length} course(s)`}>
            <button className="btn-primary" onClick={() => { setForm(EMPTY_COURSE); setEditing(null); setModal("course"); }}><Plus size={16}/> Add Course</button>
          </SectionHeader>
          {courses.length === 0 && <div className="card p-8 text-center text-gray-400">No courses in this semester yet. Click Add Course to start.</div>}
          <div className="card">
            <div className="divide-y divide-gray-50">
              {courses.map(c => {
                const trainer = c.trainerCourses?.[0]?.trainer?.user;
                return (
                  <div key={c.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.code} · {c.credits}cr · {c.hoursPerWeek}h/wk</p>
                    </div>
                    <div>
                      {trainer
                        ? <span className="badge-green text-xs">{trainer.fullName}</span>
                        : <span className="badge-yellow text-xs">No trainer</span>}
                    </div>
                    <div className="flex gap-1">
                      <button className="btn-ghost btn-sm btn-icon text-blue-500" title="Assign trainer"
                        onClick={() => { setAssignModal({courseId:c.id}); setSelTrainer(String(c.trainerCourses?.[0]?.trainer?.id||"")); }}>
                        <Plus size={13}/>
                      </button>
                      <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:c.name,code:c.code,credits:c.credits,hoursPerWeek:c.hoursPerWeek}); setEditing(c); setModal("course"); }}><Pencil size={13}/></button>
                      <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => { setDeleteId(c.id); setDeleteType("course"); }}><Trash2 size={13}/></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* ── MODALS ── */}
      {/* Program modal */}
      <Modal open={modal==="program"} onClose={() => setModal(null)} title={editing?"Edit Program":"Add Program"}
        footer={<><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={saveProgram} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Code</label><input className="input" value={form.code||""} onChange={e=>setForm(f=>({...f,code:e.target.value}))}/></div>
          <div><label className="label">Department</label><select className="select" value={form.departmentId||""} onChange={e=>setForm(f=>({...f,departmentId:e.target.value}))}><option value="">— None —</option>{depts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Duration (years)</label><input type="number" min={1} max={6} className="input" value={form.durationYears||3} onChange={e=>setForm(f=>({...f,durationYears:+e.target.value}))}/></div>
            <div><label className="label">Capacity (optional)</label><input type="number" min={1} className="input" placeholder="No limit" value={form.capacity||""} onChange={e=>setForm(f=>({...f,capacity:e.target.value}))}/></div>
          </div>
          <div><label className="label">Status</label><select className="select" value={form.status||"active"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>

      {/* Level modal */}
      <Modal open={modal==="level"} onClose={() => setModal(null)} title={editing?"Edit Level":"Add Level"}
        footer={<><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={saveLevel} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Level Name (e.g. Year 1)</label><input className="input" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Order</label><input type="number" min={1} className="input" value={form.levelOrder||1} onChange={e=>setForm(f=>({...f,levelOrder:+e.target.value}))}/></div>
        </div>
      </Modal>

      {/* Course modal */}
      <Modal open={modal==="course"} onClose={() => setModal(null)} title={editing?"Edit Course":"Add Course"}
        footer={<><button className="btn-secondary" onClick={()=>setModal(null)}>Cancel</button><button className="btn-primary" onClick={saveCourse} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Course Name</label><input className="input" value={form.name||""} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
          <div><label className="label">Code</label><input className="input" value={form.code||""} onChange={e=>setForm(f=>({...f,code:e.target.value}))}/></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Credits</label><input type="number" min={1} className="input" value={form.credits||3} onChange={e=>setForm(f=>({...f,credits:+e.target.value}))}/></div>
            <div><label className="label">Hours/Week</label><input type="number" min={1} className="input" value={form.hoursPerWeek||2} onChange={e=>setForm(f=>({...f,hoursPerWeek:+e.target.value}))}/></div>
          </div>
        </div>
      </Modal>

      {/* Assign trainer modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Trainer to Course"
        footer={<><button className="btn-secondary" onClick={()=>setAssignModal(null)}>Cancel</button><button className="btn-primary" onClick={handleAssignTrainer}>Assign</button></>}>
        <div>
          <label className="label">Select Trainer</label>
          <select className="select" value={selTrainer} onChange={e=>setSelTrainer(e.target.value)}>
            <option value="">— Remove trainer —</option>
            {allTrainers.map(t=><option key={t.id} value={t.id}>{t.user?.fullName} ({t.user?.department||"—"})</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={handleDelete}
        title={`Delete ${deleteType}`} message={`Permanently remove this ${deleteType}? All related data will be lost.`}/>
    </div>
  );
}
