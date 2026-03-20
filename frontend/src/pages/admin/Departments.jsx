import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const EMPTY = { name:"", code:"", hodUserId:"", status:"active" };

export default function Departments() {
  const [depts, setDepts]     = useState([]);
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    Promise.all([adminApi.getDepartments(), adminApi.getUsers()])
      .then(([d,u]) => { setDepts(d.data); setUsers(u.data.filter(x => x.roles?.includes("hod") || x.roles?.includes("trainer"))); setLoading(false); });
  }
  useEffect(load, []);

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateDepartment(editing.id, form);
      else         await adminApi.createDepartment(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message || "Failed"); } finally { setSaving(false); }
  }

  const cols = [
    { key:"name",     label:"Department" },
    { key:"code",     label:"Code" },
    { key:"hodName",  label:"HOD", render: d => d.hod?.fullName || d.hodName || "—" },
    { key:"programs", label:"Programs", render: d => d._count?.programs || 0 },
    { key:"status",   label:"Status", render: d => <Badge value={d.status} /> },
    { key:"actions",  label:"", render: d => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm btn-icon" onClick={() => { setForm({name:d.name,code:d.code,hodUserId:d.hodUserId||"",status:d.status}); setEditing(d); setModal(true); }}><Pencil size={14}/></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(d.id)}><Trash2 size={14}/></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="Departments" subtitle={`${depts.length} departments`}>
        <button className="btn-primary" onClick={() => { setForm(EMPTY); setEditing(null); setModal(true); }}><Plus size={16}/> Add Department</button>
      </SectionHeader>

      <Table columns={cols} data={depts} />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Department" : "Add Department"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <div><label className="label">Name</label><input className="input" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
          <div><label className="label">Code</label><input className="input" value={form.code} onChange={e=>setForm(p=>({...p,code:e.target.value}))} /></div>
          <div>
            <label className="label">HOD (optional)</label>
            <select className="select" value={form.hodUserId} onChange={e=>setForm(p=>({...p,hodUserId:e.target.value}))}>
              <option value="">— No HOD —</option>
              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
            </select>
          </div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)}
        onConfirm={async()=>{ await adminApi.deleteDepartment(deleteId); setDeleteId(null); load(); }}
        title="Delete Department" message="All programs in this department will be unlinked." />
    </div>
  );
}
