// FILE: src/pages/admin/Programs.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY = { name:"", code:"", departmentId:"", durationYears:3, status:"active" };

export default function Programs() {
  const [programs, setPrograms]   = useState([]);
  const [depts, setDepts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const navigate                  = useNavigate();

  function load() {
    Promise.all([adminApi.getPrograms(), adminApi.getDepartments()])
      .then(([p,d]) => { setPrograms(p.data); setDepts(d.data); setLoading(false); });
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateProgram(editing.id, form);
      else         await adminApi.createProgram(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    await adminApi.deleteProgram(deleteId);
    setDeleteId(null); load();
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title="Programs" subtitle="Manage academic programs">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}>
          <Plus size={16} /> Add Program
        </button>
      </SectionHeader>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {programs.map(p => (
          <div key={p.id} className="card-hover p-5 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{p.code} · {p.department?.name || "No Dept"}</p>
              </div>
              <Badge value={p.status} />
            </div>
            <p className="text-xs text-gray-500">Duration: {p.durationYears} year{p.durationYears !== 1 ? "s" : ""}</p>
            <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
              <button className="btn-secondary btn-sm flex-1 justify-center"
                onClick={() => navigate(`/admin/programs/${p.id}/courses`)}>
                <BookOpen size={13} /> View Courses <ChevronRight size={13} />
              </button>
              <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:p.name,code:p.code,departmentId:p.departmentId||"",durationYears:p.durationYears,status:p.status}); setEditing(p); setModal(true); }}>
                <Pencil size={14} />
              </button>
              <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(p.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Program" : "Add Program"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Program Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} /></div>
          <div>
            <label className="label">Department</label>
            <select className="select" value={form.departmentId} onChange={e=>setForm(p=>({...p,departmentId:e.target.value}))}>
              <option value="">— None —</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div><label className="label">Duration (years)</label><input type="number" min={1} max={6} className="input" value={form.durationYears} onChange={e=>setForm(p=>({...p,durationYears:+e.target.value}))} /></div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={()=>setDeleteId(null)} onConfirm={handleDelete}
        title="Delete Program" message="All sessions and courses in this program will also be removed." />
    </div>
  );
}
