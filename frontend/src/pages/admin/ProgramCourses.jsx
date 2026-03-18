// FILE: src/pages/admin/ProgramCourses.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, ConfirmModal } from "../../components/ui";

const EMPTY_COURSE = { name:"", code:"", credits:3, hoursPerWeek:2, sessionId:"" };

export default function ProgramCourses() {
  const { id }                  = useParams();
  const navigate                = useNavigate();
  const [data, setData]         = useState(null);
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [modal, setModal]       = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [form, setForm]         = useState(EMPTY_COURSE);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // { courseId, current }
  const [selectedTrainer, setSelectedTrainer] = useState("");

  function load() {
    Promise.all([adminApi.getProgramCourses(id), adminApi.getUsers()])
      .then(([pd, ud]) => {
        setData(pd.data);
        setTrainers(ud.data.filter(u => u.roles?.includes("trainer")));
        setLoading(false);
      })
      .catch(() => setError("Failed to load program data"));
  }
  useEffect(load, [id]);

  async function handleSaveCourse() {
    setSaving(true);
    try {
      if (editCourse) await adminApi.updateCourse(editCourse.id, form);
      else            await adminApi.createCourse(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message || "Failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    await adminApi.deleteCourse(deleteId);
    setDeleteId(null); load();
  }

  async function handleAssign() {
    await adminApi.assignTrainer(assignModal.courseId, { trainerId: selectedTrainer || null });
    setAssignModal(null); load();
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  const { program, sessions } = data;

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div>
        <button className="btn-ghost btn-sm mb-3" onClick={() => navigate("/admin/programs")}>
          <ArrowLeft size={15} /> Back to Programs
        </button>
        <h1 className="page-title">{program.name}</h1>
        <p className="page-subtitle">{program.code} · {program.department?.name}</p>
      </div>

      {sessions.length === 0 && (
        <div className="card p-8 text-center text-gray-400">
          <p>No sessions configured for this program yet.</p>
          <p className="text-sm mt-1">Sessions (Year/Semester) must be created before adding courses.</p>
        </div>
      )}

      {sessions.map(session => (
        <div key={session.id} className="card">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
            <div>
              <p className="font-semibold text-gray-900">
                {session.academicLevel?.name || "Level ?"} — {session.semester?.name || "Semester ?"}
              </p>
              <p className="text-xs text-gray-400">{session.academicYear?.name}</p>
            </div>
            <button className="btn-primary btn-sm"
              onClick={() => { setForm({...EMPTY_COURSE, sessionId: session.id}); setEditCourse(null); setModal(true); }}>
              <Plus size={14} /> Add Course
            </button>
          </div>

          {session.courses.length === 0 ? (
            <p className="px-6 py-4 text-sm text-gray-400 italic">No courses in this session yet.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {session.courses.map(course => {
                const trainer = course.trainerCourses?.[0]?.trainer?.user;
                return (
                  <div key={course.id} className="px-6 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{course.name}</p>
                      <p className="text-xs text-gray-400">{course.code} · {course.credits} cr · {course.hoursPerWeek}h/wk</p>
                    </div>
                    <div className="text-xs text-gray-500">
                      {trainer ? (
                        <span className="badge-green">{trainer.fullName}</span>
                      ) : (
                        <span className="badge-yellow">No trainer</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button title="Assign trainer" className="btn-ghost btn-sm btn-icon text-blue-500"
                        onClick={() => { setAssignModal({ courseId: course.id }); setSelectedTrainer(course.trainerCourses?.[0]?.trainer?.id || ""); }}>
                        <UserCheck size={14} />
                      </button>
                      <button className="btn-ghost btn-sm btn-icon"
                        onClick={() => { setForm({name:course.name,code:course.code,credits:course.credits,hoursPerWeek:course.hoursPerWeek,sessionId:session.id}); setEditCourse(course); setModal(true); }}>
                        <Pencil size={14} />
                      </button>
                      <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(course.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Course Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={editCourse ? "Edit Course" : "Add Course"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSaveCourse} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Course Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Credits</label><input type="number" min={1} className="input" value={form.credits} onChange={e=>setForm(p=>({...p,credits:+e.target.value}))} /></div>
            <div><label className="label">Hours/Week</label><input type="number" min={1} className="input" value={form.hoursPerWeek} onChange={e=>setForm(p=>({...p,hoursPerWeek:+e.target.value}))} /></div>
          </div>
        </div>
      </Modal>

      {/* Assign Trainer Modal */}
      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Trainer to Course"
        footer={<><button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button><button className="btn-primary" onClick={handleAssign}>Assign</button></>}>
        <div>
          <label className="label">Select Trainer</label>
          <select className="select" value={selectedTrainer} onChange={e => setSelectedTrainer(e.target.value)}>
            <option value="">— Remove trainer —</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Course" message="This will permanently remove the course and all related grades." />
    </div>
  );
}
