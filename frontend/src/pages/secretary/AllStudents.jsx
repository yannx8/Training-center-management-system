// FILE: src/pages/secretary/AllStudents.jsx
import { useEffect, useState } from "react";
import { Search, Filter, Pencil } from "lucide-react";
import { secretaryApi } from "../../api";
import Table from "../../components/ui/Table";
import Modal from "../../components/ui/Modal";
import { PageLoader, SectionHeader, Badge, ErrorAlert } from "../../components/ui";

export default function AllStudents() {
  const [students, setStudents]   = useState([]);
  const [programs, setPrograms]   = useState([]);
  const [certs, setCerts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterProgram, setFilterProgram]   = useState("");
  const [filterCert, setFilterCert]         = useState("");
  const [filterStatus, setFilterStatus]     = useState("");
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm]   = useState({});
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");

  function load() {
    const params = {};
    if (filterProgram) params.programId = filterProgram;
    if (filterCert)    params.certificationId = filterCert;
    if (filterStatus)  params.status = filterStatus;
    Promise.all([
      secretaryApi.getStudents(params),
      secretaryApi.getPrograms(),
      secretaryApi.getCertifications(),
    ]).then(([s,p,c]) => { setStudents(s.data); setPrograms(p.data); setCerts(c.data); setLoading(false); })
      .catch(() => setError("Failed to load students"));
  }
  useEffect(() => { setLoading(true); load(); }, [filterProgram, filterCert, filterStatus]);

  const filtered = search
    ? students.filter(s => s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) || s.matricule?.toLowerCase().includes(search.toLowerCase()))
    : students;

  async function handleUpdate() {
    setSaving(true);
    try {
      await secretaryApi.updateStudent(editModal.id, editForm);
      setEditModal(null); load();
    } catch(e) { alert(e.response?.data?.message||"Update failed"); } finally { setSaving(false); }
  }

  const cols = [
    { key:"matricule", label:"Matricule" },
    { key:"name",      label:"Name",    render:s => s.user?.fullName },
    { key:"email",     label:"Email",   render:s => s.user?.email },
    { key:"program",   label:"Program", render:s => s.program?.name || s.enrollments?.find(e=>e.certification)?.certification?.name || "—" },
    { key:"status",    label:"Status",  render:s => <Badge value={s.user?.status||"active"}/> },
    { key:"actions",   label:"",        render:s => (
      <button className="btn-ghost btn-sm btn-icon" title="Edit student"
        onClick={() => { setEditModal(s); setEditForm({ fullName:s.user?.fullName, phone:s.user?.phone, status:s.user?.status }); }}>
        <Pencil size={14}/>
      </button>
    )},
  ];

  if (loading) return <PageLoader />;

  return (
    <div className="space-y-4">
      <SectionHeader title="All Students" subtitle={`${filtered.length} of ${students.length} students`}/>
      {error && <ErrorAlert message={error} />}

      {/* Search + Filters */}
      <div className="card p-4 flex flex-wrap gap-3 items-end">
        <div className="relative flex-1 min-w-[180px]">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input className="input pl-9 text-sm" placeholder="Search name or matricule…" value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-gray-400"/>
          <select className="select text-sm w-44" value={filterProgram} onChange={e=>{setFilterProgram(e.target.value);setFilterCert("");}}>
            <option value="">All Programs</option>
            {programs.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select className="select text-sm w-44" value={filterCert} onChange={e=>{setFilterCert(e.target.value);setFilterProgram("");}}>
            <option value="">All Certs</option>
            {certs.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="select text-sm w-32" value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      <Table columns={cols} data={filtered} emptyMsg="No students match your filters."/>

      {/* Edit modal — no delete */}
      <Modal open={!!editModal} onClose={()=>setEditModal(null)} title="Edit Student"
        footer={<><button className="btn-secondary" onClick={()=>setEditModal(null)}>Cancel</button><button className="btn-primary" onClick={handleUpdate} disabled={saving}>{saving?"Saving…":"Save"}</button></>}>
        <div className="space-y-4">
          <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">⚠ Secretaries can update student data but cannot delete students.</p>
          <div><label className="label">Full Name</label><input className="input" value={editForm.fullName||""} onChange={e=>setEditForm(f=>({...f,fullName:e.target.value}))}/></div>
          <div><label className="label">Phone</label><input className="input" value={editForm.phone||""} onChange={e=>setEditForm(f=>({...f,phone:e.target.value}))}/></div>
          <div><label className="label">Status</label><select className="select" value={editForm.status||"active"} onChange={e=>setEditForm(f=>({...f,status:e.target.value}))}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
      </Modal>
    </div>
  );
}
