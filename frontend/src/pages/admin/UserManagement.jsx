// FILE: src/pages/admin/UserManagement.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search, Filter } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const ROLES   = ["admin","secretary","hod","trainer","student","parent"];
const EMPTY   = { fullName:"", email:"", phone:"", roleName:"trainer", department:"", status:"active" };

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [filterRole, setFilterRole]     = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    setLoading(true);
    adminApi.getUsers(filterRole ? { role: filterRole } : {})
      .then(r => { setUsers(r.data); setLoading(false); })
      .catch(() => setError("Failed to load users"));
  }
  useEffect(load, [filterRole]);

  function openCreate() { setForm(EMPTY); setEditing(null); setModal(true); }
  function openEdit(u) {
    setForm({ fullName:u.fullName, email:u.email, phone:u.phone||"", roleName:u.roles?.[0]||"trainer", department:u.department||"", status:u.status });
    setEditing(u); setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateUser(editing.id, { ...form, roles:[form.roleName] });
      else         await adminApi.createUser(form);
      setModal(false); load();
    } catch(e) { alert(e.response?.data?.message || "Save failed"); } finally { setSaving(false); }
  }

  const filtered = users.filter(u => {
    const matchSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = !filterStatus || u.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const cols = [
    { key:"fullName", label:"Name" },
    { key:"email",    label:"Email" },
    { key:"phone",    label:"Phone", render: u => u.phone || "—" },
    { key:"roles",    label:"Role",  render: u => <div className="flex gap-1 flex-wrap">{(u.roles||[]).map(r=><Badge key={r} value={r} label={r}/>)}</div> },
    { key:"status",   label:"Status",render: u => <Badge value={u.status} /> },
    { key:"actions",  label:"", render: u => (
      <div className="flex gap-1">
        <button className="btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}><Pencil size={14}/></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(u.id)}><Trash2 size={14}/></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title="User Management" subtitle={`${filtered.length} of ${users.length} users`}>
        <button className="btn-primary" onClick={openCreate}><Plus size={16}/> Add User</button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      {/* Search + Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9 text-sm" placeholder="Search name or email…" value={search} onChange={e=>setSearch(e.target.value)} />
        </div>
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-gray-400" />
          <select className="select text-sm w-36" value={filterRole} onChange={e=>setFilterRole(e.target.value)}>
            <option value="">All Roles</option>
            {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select className="select text-sm w-32" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Table columns={cols} data={filtered} emptyMsg="No users match your filters." />

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit User" : "Add New User"}
        footer={<><button className="btn-secondary" onClick={() => setModal(false)}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          {[["Full Name","fullName","text"],["Email","email","email"],["Phone","phone","tel"]].map(([l,k,t])=>(
            <div key={k}><label className="label">{l}</label><input type={t} className="input" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
          <div><label className="label">Role</label><select className="select" value={form.roleName} onChange={e=>setForm(p=>({...p,roleName:e.target.value}))}>{ROLES.map(r=><option key={r}>{r}</option>)}</select></div>
          <div><label className="label">Department</label><input className="input" value={form.department} onChange={e=>setForm(p=>({...p,department:e.target.value}))} /></div>
          <div><label className="label">Status</label><select className="select" value={form.status} onChange={e=>setForm(p=>({...p,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>
      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={async()=>{ await adminApi.deleteUser(deleteId); setDeleteId(null); load(); }}
        title="Delete User" message="This action cannot be undone." />
    </div>
  );
}
