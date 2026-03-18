// FILE: src/pages/secretary/SecretaryDashboard.jsx
import { useEffect, useState } from "react";
import { Users, BookMarked, Award, Building2 } from "lucide-react";
import { secretaryApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function SecretaryDashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    secretaryApi.getDashboard().then(r => setData(r.data)).catch(() => setError("Load failed"));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { studentCount, programCount, certCount, deptCount, recentStudents } = data;

  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Secretary Dashboard</h1><p className="page-subtitle">School overview</p></div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:"Students", value: studentCount, icon: <Users size={22} />, color:"bg-cyan-100 text-cyan-700" },
          { label:"Departments", value: deptCount, icon: <Building2 size={22} />, color:"bg-violet-100 text-violet-700" },
          { label:"Programs", value: programCount, icon: <BookMarked size={22} />, color:"bg-blue-100 text-blue-700" },
          { label:"Certifications", value: certCount, icon: <Award size={22} />, color:"bg-amber-100 text-amber-700" },
        ].map(s => (
          <div key={s.label} className="card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>{s.icon}</div>
            <div><p className="text-xl font-bold text-gray-900">{s.value}</p><p className="text-xs text-gray-500">{s.label}</p></div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 font-semibold text-gray-900">Recent Registrations</div>
        {recentStudents.length === 0 && <p className="px-5 py-6 text-sm text-gray-400">No students registered yet.</p>}
        <div className="divide-y divide-gray-50">
          {recentStudents.map(s => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{s.user?.fullName}</p>
                <p className="text-xs text-gray-400">{s.matricule} · {s.program?.name || "Certification"}</p>
              </div>
              <p className="text-xs text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
