// FILE: src/pages/parent/ParentDashboard.jsx
import { useEffect, useState } from "react";
import { Megaphone, Users } from "lucide-react";
import { parentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function ParentDashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    parentApi.getDashboard().then(r => setData(r.data)).catch(() => setError("Failed to load"));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { children, latestAnnouncements, pendingComplaints } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Parent Dashboard</h1>
        <p className="page-subtitle">Monitor your {children.length} child{children.length!==1?"ren":""}'s progress</p>
      </div>

      {/* Children */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {children.map(c => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center text-pink-600 font-bold">
                {c.user?.fullName?.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{c.user?.fullName}</p>
                <p className="text-xs text-gray-400">{c.program?.name}</p>
                <p className="text-xs text-gray-400">{c.matricule}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Announcements */}
      {latestAnnouncements?.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Megaphone size={16} className="text-primary-500" /><h2 className="font-semibold">Latest Announcements</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {latestAnnouncements.map(a => (
              <div key={a.id} className="px-5 py-3">
                <p className="font-semibold text-sm text-gray-800">{a.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{a.body}</p>
                <p className="text-xs text-gray-400 mt-1">{a.department?.name} · {new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
