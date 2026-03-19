// FILE: src/pages/secretary/SecretaryDashboard.jsx
import { useEffect, useState } from "react";
import { Users, BookMarked, Award, Building2 } from "lucide-react";
import { secretaryApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function SecretaryDashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    secretaryApi.getDashboard().then(r => setData(r.data)).catch(() => setError("Failed to load"));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { activeYear, programs, certifications, studentCount } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Secretary Dashboard</h1>
        {activeYear && <p className="page-subtitle">Active Academic Year: <span className="font-semibold text-gray-700">{activeYear.name}</span></p>}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Students", value:studentCount, icon:<Users size={20}/>, color:"bg-cyan-100 text-cyan-700" },
          { label:"Programs", value:programs.length, icon:<BookMarked size={20}/>, color:"bg-blue-100 text-blue-700" },
          { label:"Certifications", value:certifications.length, icon:<Award size={20}/>, color:"bg-violet-100 text-violet-700" },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Academic programs */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><BookMarked size={15} className="text-blue-500"/> Academic Programs</h2>
            {activeYear && <p className="text-xs text-gray-400 mt-0.5">For {activeYear.name}</p>}
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {programs.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No programs for this academic year.</p>}
            {programs.map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">{p.name}</p>
                  <p className="text-xs text-gray-400">{p.code} · {p.department?.name}</p>
                </div>
                <span className="text-xs text-gray-500">
                  {p._count?.enrollments || 0}{p.capacity ? `/${p.capacity}` : ""} enrolled
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Certifications */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2"><Award size={15} className="text-violet-500"/> Certifications</h2>
            <p className="text-xs text-gray-400 mt-0.5">Current enrollment status</p>
          </div>
          <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
            {certifications.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No active certifications.</p>}
            {certifications.map(c => {
              const trainer = c.trainerCourses?.[0]?.trainer?.user;
              return (
                <div key={c.id} className="px-5 py-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.code} · {c.durationHours}h</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {c._count?.enrollments || 0}{c.capacity ? `/${c.capacity}` : ""} enrolled
                    </span>
                  </div>
                  {trainer && <p className="text-xs text-gray-400 mt-0.5">Trainer: {trainer.fullName}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
