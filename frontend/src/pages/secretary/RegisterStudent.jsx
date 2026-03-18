// FILE: src/pages/secretary/RegisterStudent.jsx
import { useEffect, useState } from "react";
import { UserPlus, Check } from "lucide-react";
import { secretaryApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

const EMPTY = { fullName:"", email:"", phone:"", dateOfBirth:"", programId:"", parentFullName:"", parentEmail:"", parentPhone:"", parentRelationship:"Father", certificationIds:[] };

export default function RegisterStudent() {
  const [programs, setPrograms]   = useState([]);
  const [certs, setCerts]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");

  useEffect(() => {
    Promise.all([secretaryApi.getPrograms(), secretaryApi.getCertifications()])
      .then(([p,c]) => { setPrograms(p.data); setCerts(c.data); setLoading(false); });
  }, []);

  function toggleCert(id) {
    setForm(f => ({
      ...f,
      certificationIds: f.certificationIds.includes(id)
        ? f.certificationIds.filter(c => c !== id)
        : [...f.certificationIds, id],
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault(); setError(""); setSuccess(""); setSaving(true);
    try {
      const r = await secretaryApi.registerStudent(form);
      setSuccess(`Student registered! Matricule: ${r.data.student.matricule}`);
      setForm(EMPTY);
    } catch(e) { setError(e.response?.data?.message || "Registration failed"); }
    finally { setSaving(false); }
  }

  if (loading) return <PageLoader />;
  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h1 className="page-title">Register Student</h1>
        <p className="page-subtitle">Create a student account and link to parent</p>
      </div>
      {error   && <ErrorAlert message={error} />}
      {success && <div className="card p-4 bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-2"><Check size={16}/>{success}</div>}

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2">Student Information</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[["Full Name","fullName","text"],["Email","email","email"],["Phone","phone","tel"],["Date of Birth","dateOfBirth","date"]].map(([l,k,t]) => (
            <div key={k}><label className="label">{l}</label><input type={t} className="input" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} required={["fullName","email","phone"].includes(k)} /></div>
          ))}
        </div>
        <div>
          <label className="label">Program *</label>
          <select className="select" value={form.programId} onChange={e=>setForm(p=>({...p,programId:e.target.value}))} required>
            <option value="">— Select Program —</option>
            {programs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {certs.length > 0 && (
          <div>
            <label className="label">Enroll in Certifications (optional)</label>
            <div className="grid sm:grid-cols-2 gap-2 mt-1">
              {certs.map(c => (
                <label key={c.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-sm ${form.certificationIds.includes(c.id)?"border-primary-400 bg-primary-50":"border-gray-200 hover:bg-gray-50"}`}>
                  <input type="checkbox" checked={form.certificationIds.includes(c.id)} onChange={()=>toggleCert(c.id)} className="accent-primary-600" />
                  {c.name}
                </label>
              ))}
            </div>
          </div>
        )}

        <p className="font-semibold text-gray-700 text-sm uppercase tracking-wide border-b pb-2 pt-3">Parent / Guardian Information</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {[["Full Name","parentFullName"],["Email","parentEmail"],["Phone","parentPhone"]].map(([l,k]) => (
            <div key={k}><label className="label">{l}</label><input className="input" value={form[k]} onChange={e=>setForm(p=>({...p,[k]:e.target.value}))} /></div>
          ))}
          <div>
            <label className="label">Relationship</label>
            <select className="select" value={form.parentRelationship} onChange={e=>setForm(p=>({...p,parentRelationship:e.target.value}))}>
              {["Father","Mother","Guardian"].map(r=><option key={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full justify-center py-2.5" disabled={saving}>
          <UserPlus size={16} /> {saving ? "Registering…" : "Register Student"}
        </button>
      </form>
    </div>
  );
}
