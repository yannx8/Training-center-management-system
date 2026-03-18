// FILE: src/pages/admin/Programs.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, BookOpen, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY = { name:"", code:"", departmentId:"", durationYears:3, status:"active", capacity:"" };

export default function Programs() {
  const [grouped, setGrouped]   = useState([]);
  const [depts, setDepts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  function load() {
    Promise.all([adminApi.getPrograms(), adminApi.getDepartments()])
      .then(([p,d]) => { setGrouped(p.grouped || []); setDepts(d.data); setLoading(false); });
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateProgram(editing.id, form);
      else         await adminApi.createProgram(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message || "Failed"); } finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-5">
      <SectionHeader title="Programs" subtitle="Grouped by department">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}><Plus size={16}/> Add Program</button>
      </SectionHeader>

      {grouped.map(group => (
        <div key={group.department?.name || "none"} className="space-y-3">
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider px-1">
            {group.department?.name || "No Department"}
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {group.programs.map(p => (
              <div key={p.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{p.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{p.code} · {p.durationYears}yr</p>
                  </div>
                  <Badge value={p.status} />
                </div>
                {p.capacity && (
                  <div className="text-xs text-gray-500">
                    Capacity: {p.enrollmentCount}/{p.capacity}
                    <div className="w-full bg-gray-100 rounded-full h-1.5 mt-1">
                      <div className="bg-primary-500 h-1.5 rounded-full" style={{ width: `${Math.min(100,(p.enrollmentCount/p.capacity)*100)}%` }} />
                    </div>
                  </div>
                )}
                <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
                  <button className="btn-secondary btn-sm flex-1 justify-center text-xs" onClick={() => navigate(`/admin/programs/${p.id}/courses`)}>
                    <BookOpen size={12}/> Courses <ChevronRight size={12}/>
                  </button>
                  <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:p.name,code:p.code,departmentId:p.departmentId||"",durationYears:p.durationYears,status:p.status,capacity:p.capacity||""}); setEditing(p); setModal(true); }}><Pencil size={13}/></button>
                  <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(p.id)}><Trash2 size={13}/></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {grouped.length === 0 && <div className="card p-10 text-center text-gray-400">No programs yet.</div>}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Program" : "Add Program"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} /></div>
          <div>
            <label className="label">Department</label>
            <select className="select" value={form.departmentId} onChange={e=>setForm(p=>({...p,departmentId:e.target.value}))}>
              <option value="">— None —</option>
              {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Duration (years)</label><input type="number" min={1} max={6} className="input" value={form.durationYears} onChange={e=>setForm(p=>({...p,durationYears:+e.target.value}))} /></div>
            <div><label className="label">Max Students (optional)</label><input type="number" min={1} className="input" placeholder="No limit" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))} /></div>
          </div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async()=>{ await adminApi.deleteProgram(deleteId); setDeleteId(null); load(); }}
        title="Delete Program" message="All sessions and courses will be removed." />
    </div>
  );
}
