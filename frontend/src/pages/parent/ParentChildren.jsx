// FILE: src/pages/parent/ParentChildren.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CalendarDays, BarChart2, GraduationCap } from "lucide-react";
import { parentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function ParentChildren() {
  const [children, setChildren] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    parentApi.getChildren()
      .then(r => { setChildren(r.data); setLoading(false); })
      .catch(() => setError("Failed to load children data"));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Children</h1>
        <p className="page-subtitle">{children.length} child{children.length !== 1 ? "ren" : ""} linked to your account</p>
      </div>

      {children.length === 0 && (
        <div className="card p-12 text-center">
          <Users size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No children linked</p>
          <p className="text-sm text-gray-400 mt-1">Contact the secretary to link your children to your account.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {children.map(child => (
          <div key={child.id} className="card p-6 space-y-4">
            {/* Child info */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-pink-100 rounded-2xl flex items-center justify-center text-pink-600 text-xl font-bold flex-shrink-0">
                {child.user?.fullName?.charAt(0) || "?"}
              </div>
              <div>
                <p className="font-bold text-gray-900 text-lg leading-tight">{child.user?.fullName}</p>
                <p className="text-sm text-gray-500">{child.matricule}</p>
                <p className="text-xs text-gray-400 mt-0.5">{child.program?.name || "No program"}</p>
                {child.program?.department?.name && (
                  <p className="text-xs text-gray-400">{child.program.department.name}</p>
                )}
              </div>
            </div>

            {/* Quick action buttons */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100">
              <button className="btn-secondary btn-sm justify-center"
                onClick={() => navigate(`/parent/timetable?childId=${child.id}`)}>
                <CalendarDays size={14} /> Timetable
              </button>
              <button className="btn-secondary btn-sm justify-center"
                onClick={() => navigate(`/parent/grades?childId=${child.id}`)}>
                <BarChart2 size={14} /> Grades
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
