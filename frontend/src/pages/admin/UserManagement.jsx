// FILE: src/pages/admin/UserManagement.jsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { adminApi } from "../../api";
import Modal from "../../components/ui/Modal";
import Table from "../../components/ui/Table";
import { PageLoader, ErrorAlert, SectionHeader, ConfirmModal, Badge } from "../../components/ui";

const ROLES = ["admin","secretary","hod","trainer","student","parent"];
const EMPTY = { fullName:"", email:"", phone:"", roleName:"trainer", department:"", status:"active" };

export default function UserManagement() {
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");
  const [modal, setModal]       = useState(false);
  const [editing, setEditing]   = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  function load() {
    setLoading(true);
    adminApi.getUsers().then(r => { setUsers(r.data); setLoading(false); }).catch(() => setError("Failed to load users"));
  }
  useEffect(load, []);

  function openCreate()   { setForm(EMPTY); setEditing(null); setModal(true); }
  function openEdit(u)    { setForm({ fullName: u.fullName, email: u.email, phone: u.phone||"", roleName: u.roles?.[0]||"trainer", department: u.department||"", status: u.status }); setEditing(u); setModal(true); }
  function closeModal()   { setModal(false); setEditing(null); }

  async function handleSave() {
    setSaving(true);
    try {
      if (editing) await adminApi.updateUser(editing.id, { ...form, roles: [form.roleName] });
      else         await adminApi.createUser(form);
      closeModal(); load();
    } catch (e) { alert(e.response?.data?.message || "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    await adminApi.deleteUser(deleteId);
    setDeleteId(null); load();
  }

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const cols = [
    { key:"fullName", label:"Name" },
    { key:"email", label:"Email" },
    { key:"phone", label:"Phone", render: u => u.phone || "—" },
    { key:"roles", label:"Role", render: u => <div className="flex gap-1 flex-wrap">{(u.roles||[]).map(r => <Badge key={r} value={r} label={r} />)}</div> },
    { key:"status", label:"Status", render: u => <Badge value={u.status} /> },
    { key:"actions", label:"", render: u => (
      <div className="flex gap-2">
        <button className="btn-ghost btn-sm btn-icon" onClick={() => openEdit(u)}><Pencil size={14} /></button>
        <button className="btn-ghost btn-sm btn-icon text-red-500 hover:bg-red-50" onClick={() => setDeleteId(u.id)}><Trash2 size={14} /></button>
      </div>
    )},
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title="User Management" subtitle={`${users.length} users total`}>
        <button className="btn-primary" onClick={openCreate}><Plus size={16} /> Add User</button>
      </SectionHeader>
      {error && <ErrorAlert message={error} />}

      <div className="card p-4">
        <div className="relative max-w-xs">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="input pl-9" placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <Table columns={cols} data={filtered} emptyMsg="No users found." />

      {/* Create/Edit Modal */}
      <Modal open={modal} onClose={closeModal} title={editing ? "Edit User" : "Add New User"}
        footer={<><button className="btn-secondary" onClick={closeModal}>Cancel</button><button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? "Saving…" : "Save"}</button></>}>
        <div className="space-y-4">
          {[["Full Name","fullName","text"],["Email","email","email"],["Phone","phone","tel"]].map(([label,key,type]) => (
            <div key={key}>
              <label className="label">{label}</label>
              <input type={type} className="input" value={form[key]} onChange={e => setForm(p=>({...p,[key]:e.target.value}))} />
            </div>
          ))}
          <div>
            <label className="label">Role</label>
            <select className="select" value={form.roleName} onChange={e => setForm(p=>({...p,roleName:e.target.value}))}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Department</label>
            <input className="input" value={form.department} onChange={e => setForm(p=>({...p,department:e.target.value}))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="select" value={form.status} onChange={e => setForm(p=>({...p,status:e.target.value}))}>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteId} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Delete User" message="This action cannot be undone. Are you sure you want to delete this user?" />
    </div>
  );
}
