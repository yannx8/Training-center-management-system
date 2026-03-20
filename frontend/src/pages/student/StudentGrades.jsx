import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

function GradePill({ letter, value }) {
  const num = parseFloat(value);
  let cls = "bg-green-100 text-green-700";
  if (num < 50) cls = "bg-red-100 text-red-700";
  else if (num < 70) cls = "bg-yellow-100 text-yellow-700";
  return (
    <div className={`rounded-lg px-3 py-1.5 text-center min-w-[56px] ${cls}`}>
      <p className="text-lg font-bold leading-none">{letter || "—"}</p>
      <p className="text-[11px] opacity-70 mt-0.5">{num.toFixed(1)}</p>
    </div>
  );
}

export default function StudentGrades() {
  const [grades, setGrades]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    studentApi.getGrades()
      .then(r => { setGrades(r.data); setLoading(false); })
      .catch(() => setError("Failed to load grades"));
  }, []);

  // Separate academic and cert grades
  const academic = grades.filter(g => g.courseId);
  const certs    = grades.filter(g => g.certificationId);

  // GPA
  const numericGrades = grades.filter(g => g.grade !== null).map(g => parseFloat(g.grade));
  const avg = numericGrades.length ? (numericGrades.reduce((a,b) => a+b, 0) / numericGrades.length).toFixed(1) : null;

  // Group academic by program session
  const grouped = {};
  for (const g of academic) {
    const key = g.course?.session?.program?.name || "Unknown Program";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(g);
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Grades</h1>
        <p className="page-subtitle">{grades.length} grade record{grades.length !== 1 ? "s" : ""}</p>
      </div>

      {grades.length === 0 && (
        <div className="card p-12 text-center">
          <BarChart2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No grades recorded yet.</p>
        </div>
      )}

      {grades.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-primary-600">{avg || "—"}</p>
              <p className="text-xs text-gray-500 mt-1">Overall Average</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{grades.filter(g => parseFloat(g.grade) >= 50).length}</p>
              <p className="text-xs text-gray-500 mt-1">Passed</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-2xl font-bold text-red-500">{grades.filter(g => parseFloat(g.grade) < 50).length}</p>
              <p className="text-xs text-gray-500 mt-1">Failed</p>
            </div>
          </div>

          {/* Academic grades */}
          {Object.entries(grouped).map(([prog, gs]) => (
            <div key={prog} className="card">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
                <p className="font-semibold text-gray-900">{prog}</p>
              </div>
              <div className="divide-y divide-gray-50">
                {gs.map(g => (
                  <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{g.course?.name}</p>
                      <p className="text-xs text-gray-400">{g.course?.code} · {g.course?.session?.academicLevel?.name} · {g.course?.session?.semester?.name}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{g.academicYear?.name || ""}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Certification grades */}
          {certs.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 bg-violet-50">
                <p className="font-semibold text-gray-900">Certifications</p>
              </div>
              <div className="divide-y divide-gray-50">
                {certs.map(g => (
                  <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{g.certification?.name}</p>
                      <p className="text-xs text-gray-400">{g.certification?.code}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
