import { useEffect, useState } from "react";
import { Megaphone, CalendarDays, BarChart2 } from "lucide-react";
import { studentApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function StudentDashboard() {
  const [data, setData]   = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    studentApi.getDashboard().then(r => setData(r.data)).catch(() => setError("Failed to load dashboard"));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { student, recentGrades, latestAnnouncements, upcomingSlots } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Welcome, {student?.user?.fullName?.split(" ")[0]}!</h1>
        <p className="page-subtitle">{student?.program?.name} · {student?.matricule}</p>
      </div>

      {/* Announcements */}
      {latestAnnouncements?.length > 0 && (
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <Megaphone size={16} className="text-primary-500" />
            <h2 className="font-semibold text-gray-900">Latest Announcements</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {latestAnnouncements.map(a => (
              <div key={a.id} className="px-5 py-3">
                <p className="text-sm font-semibold text-gray-800">{a.title}</p>
                <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">{a.body}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Upcoming sessions */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500" />
            <h2 className="font-semibold text-gray-900">Upcoming Sessions</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {upcomingSlots?.slice(0,4).map(s => (
              <div key={s.id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-800">{s.course?.name}</p>
                <p className="text-xs text-gray-400">{s.dayOfWeek} · {s.timeStart?.slice(0,5)} – {s.timeEnd?.slice(0,5)} · {s.room?.name || "—"}</p>
              </div>
            ))}
            {!upcomingSlots?.length && <p className="px-5 py-4 text-sm text-gray-400">No sessions scheduled yet.</p>}
          </div>
        </div>

        {/* Recent grades */}
        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <BarChart2 size={16} className="text-green-500" />
            <h2 className="font-semibold text-gray-900">Recent Grades</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentGrades?.slice(0,4).map(g => (
              <div key={g.id} className="px-5 py-3 flex items-center justify-between">
                <p className="text-sm text-gray-700">{g.course?.name || g.certification?.name}</p>
                <span className={`font-bold text-lg ${+g.grade>=50?"text-green-600":"text-red-600"}`}>{g.gradeLetter || "—"}</span>
              </div>
            ))}
            {!recentGrades?.length && <p className="px-5 py-4 text-sm text-gray-400">No grades recorded yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
