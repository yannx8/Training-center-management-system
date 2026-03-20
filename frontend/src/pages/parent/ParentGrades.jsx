import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { BarChart2 } from "lucide-react";
import { parentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

function GradePill({ letter, value }) {
  const num = parseFloat(value);
  let cls = "bg-green-100 text-green-700";
  if (num < 50) cls = "bg-red-100 text-red-700";
  else if (num < 70) cls = "bg-yellow-100 text-yellow-700";
  return (
    <div className={`rounded-lg px-3 py-1.5 text-center min-w-[52px] ${cls}`}>
      <p className="text-base font-bold leading-none">{letter || "—"}</p>
      <p className="text-[11px] opacity-70 mt-0.5">{num.toFixed(1)}</p>
    </div>
  );
}

export default function ParentGrades() {
  const [searchParams]            = useSearchParams();
  const [children, setChildren]   = useState([]);
  const [childId, setChildId]     = useState(searchParams.get("childId") || "");
  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  useEffect(() => {
    parentApi.getChildren()
      .then(r => {
        setChildren(r.data);
        if (!childId && r.data.length > 0) setChildId(String(r.data[0].id));
        setLoading(false);
      })
      .catch(() => setError("Failed to load children"));
  }, []);

  useEffect(() => {
    if (!childId) return;
    parentApi.getChildGrades(childId)
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load grades"));
  }, [childId]);

  const grades = data?.grades || [];
  const child  = data?.child || children.find(c => String(c.id) === String(childId));
  const academic = grades.filter(g => g.courseId);
  const certGrades = grades.filter(g => g.certificationId);
  const nums = grades.filter(g => g.grade !== null).map(g => parseFloat(g.grade));
  const avg = nums.length ? (nums.reduce((a,b) => a+b, 0) / nums.length).toFixed(1) : null;

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h1 className="page-title">Child Grades</h1>
          {child && <p className="page-subtitle">{child.user?.fullName} · {child.matricule}</p>}
        </div>
        {children.length > 1 && (
          <div>
            <label className="label">Select Child</label>
            <select className="select w-52" value={childId} onChange={e => setChildId(e.target.value)}>
              {children.map(c => <option key={c.id} value={c.id}>{c.user?.fullName}</option>)}
            </select>
          </div>
        )}
      </div>

      {grades.length === 0 && (
        <div className="card p-12 text-center">
          <BarChart2 size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500">No grades recorded for this student yet.</p>
        </div>
      )}

      {grades.length > 0 && (
        <>
          <div className="grid grid-cols-3 gap-4">
            <div className="card p-4 text-center"><p className="text-2xl font-bold text-primary-600">{avg || "—"}</p><p className="text-xs text-gray-500 mt-1">Average</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-bold text-green-600">{grades.filter(g => parseFloat(g.grade) >= 50).length}</p><p className="text-xs text-gray-500 mt-1">Passed</p></div>
            <div className="card p-4 text-center"><p className="text-2xl font-bold text-red-500">{grades.filter(g => parseFloat(g.grade) < 50).length}</p><p className="text-xs text-gray-500 mt-1">Failed</p></div>
          </div>

          {academic.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 font-semibold text-gray-900">Academic Courses</div>
              <div className="divide-y divide-gray-50">
                {academic.map(g => (
                  <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">{g.course?.name}</p>
                      <p className="text-xs text-gray-400">{g.course?.code}</p>
                    </div>
                    <p className="text-xs text-gray-400 flex-shrink-0">{g.academicYear?.name || ""}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {certGrades.length > 0 && (
            <div className="card">
              <div className="px-5 py-4 border-b border-gray-100 bg-violet-50 font-semibold text-gray-900">Certifications</div>
              <div className="divide-y divide-gray-50">
                {certGrades.map(g => (
                  <div key={g.id} className="px-5 py-3 flex items-center gap-4">
                    <GradePill letter={g.gradeLetter} value={g.grade} />
                    <div className="flex-1"><p className="text-sm font-medium text-gray-900">{g.certification?.name}</p></div>
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
