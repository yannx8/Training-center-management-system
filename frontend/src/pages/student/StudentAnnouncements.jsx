// FILE: src/pages/student/StudentAnnouncements.jsx
import { useEffect, useState } from "react";
import { Megaphone, Bell } from "lucide-react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function StudentAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    studentApi.getAnnouncements()
      .then(r => { setAnnouncements(r.data); setLoading(false); })
      .catch(() => setError("Failed to load announcements"));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">Announcements</h1>
        <p className="page-subtitle">Announcements from your department</p>
      </div>

      {announcements.length === 0 && (
        <div className="card p-12 text-center">
          <Megaphone size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No announcements yet</p>
          <p className="text-sm text-gray-400 mt-1">Messages from your HOD will appear here.</p>
        </div>
      )}

      <div className="space-y-3">
        {announcements.map(a => (
          <div key={a.id} className="card p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bell size={18} className="text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-gray-900">{a.title}</p>
                  {a.department?.name && <span className="badge-blue">{a.department.name}</span>}
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{a.body}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {a.creator?.fullName} · {new Date(a.createdAt).toLocaleDateString("en-GB", { day:"numeric", month:"long", year:"numeric" })}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
