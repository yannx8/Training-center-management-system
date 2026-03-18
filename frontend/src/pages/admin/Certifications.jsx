// FILE: src/pages/admin/Certifications.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, UserCheck } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY = { name:"", code:"", description:"", durationHours:20, status:"active", capacity:"" };

export default function Certifications() {
  const [certs, setCerts]         = useState([]);
  const [trainers, setTrainers]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);
  const [assignModal, setAssignModal] = useState(null);
  const [selTrainer, setSelTrainer]   = useState("");

  function load() {
    Promise.all([adminApi.getCertifications(), adminApi.getUsers()])
      .then(([c,u]) => { setCerts(c.data); setTrainers(u.data.filter(x=>x.roles?.includes("trainer"))); setLoading(false); });
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateCertification(editing.id, form);
      else         await adminApi.createCertification(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message||"Failed"); } finally { setSaving(false); }
  }

  async function handleAssign() {
    await adminApi.assignTrainerToCert(assignModal.certId, { trainerId: selTrainer || null });
    setAssignModal(null); load();
  }

  const cols = [
    { key:"name",    label:"Certification" },
    { key:"code",    label:"Code" },
    { key:"hours",   label:"Hours", render: c => `${c.durationHours}h` },
    { key:"trainer", label:"Trainer", render: c => {
      const t = c.trainerCourses?.[0]?.trainer?.user;
      return t ? <span className="badge-green">{t.fullName}</span> : <span className="badge-yellow">Unassigned</span>;
    }},
    { key:"capacity",label:"Enrolments", render: c => c.capacity ? `${c._count?.enrollments||0}/${c.capacity}` : `${c._count?.enrollments||0}` },
    { key:"status",  label:"Status", render: c => <Badge value={c.status} /> },
    { key:"actions", label:"", render: c => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm btn-icon text-blue-500" title="Assign trainer"
          onClick={() => { setAssignModal({certId:c.id}); setSelTrainer(String(c.trainerCourses?.[0]?.trainer?.user?.id||"")); }}>
          <UserCheck size={14}/>
        </button>
        <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:c.name,code:c.code,description:c.description||"",durationHours:c.durationHours,status:c.status,capacity:c.capacity||""}); setEditing(c); setModal(true); }}><Pencil size={14}/></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(c.id)}><Trash2 size={14}/></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="Certifications" subtitle="Standalone certifications">
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}><Plus size={16}/> Add Certification</button>
      </SectionHeader>
      <Table columns={cols} data={certs} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing?"Edit Certification":"Add Certification"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} /></div>
          <div><label className="label">Description</label><textarea rows={2} className="input" value={form.description} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Duration (hours)</label><input type="number" min={1} className="input" value={form.durationHours} onChange={e=>setForm(p=>({...p,durationHours:+e.target.value}))} /></div>
            <div><label className="label">Max Students (optional)</label><input type="number" min={1} className="input" placeholder="No limit" value={form.capacity} onChange={e=>setForm(p=>({...p,capacity:e.target.value}))} /></div>
          </div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>

      <Modal open={!!assignModal} onClose={() => setAssignModal(null)} title="Assign Trainer"
        footer={<><button className="btn-secondary" onClick={() => setAssignModal(null)}>Cancel</button><button className="btn-primary" onClick={handleAssign}>Assign</button></>}>
        <div>
          <label className="label">Trainer</label>
          <select className="select" value={selTrainer} onChange={e=>setSelTrainer(e.target.value)}>
            <option value="">— Remove trainer —</option>
            {trainers.map(t => <option key={t.id} value={t.id}>{t.fullName}</option>)}
          </select>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async()=>{ await adminApi.deleteCertification(deleteId); setDeleteId(null); load(); }}
        title="Delete Certification" message="All enrollments and grades will also be removed." />
    </div>
  );
}
