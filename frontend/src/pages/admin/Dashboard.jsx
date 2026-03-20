import { useEffect, useState } from "react";
import { Users, Building2, BookMarked, DoorOpen, MessageSquare, Award } from "lucide-react";
import { adminApi } from "../../api";
import { StatCard, PageLoader, ErrorAlert, Badge } from "../../components/ui";

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminApi.getDashboard()
      .then(r => setData(r.data))
      .catch(() => setError("Failed to load dashboard"));
  }, []);

  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;

  const { stats, recentUsers } = data;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Admin Dashboard</h1>
        <p className="page-subtitle">System overview and recent activity</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-violet-600">{stats.userCount}</p>
          <p className="text-xs text-gray-500 mt-1">Total Users</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-teal-600">{stats.deptCount}</p>
          <p className="text-xs text-gray-500 mt-1">Departments</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-blue-600">{stats.programCount}</p>
          <p className="text-xs text-gray-500 mt-1">Programs</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{stats.trainerCount}</p>
          <p className="text-xs text-gray-500 mt-1">Trainers</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{stats.studentCount}</p>
          <p className="text-xs text-gray-500 mt-1">Students</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.pendingComplaints}</p>
          <p className="text-xs text-gray-500 mt-1">Pending Complaints</p>
        </div>
      </div>

      {/* Recent users */}
      <div className="card">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Recently Added Users</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {recentUsers.map(u => (
            <div key={u.id} className="px-6 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">{u.fullName}</p>
                <p className="text-xs text-gray-400">{u.email}</p>
              </div>
              <div className="flex gap-1 flex-wrap justify-end">
                {u.roles.map(r => <Badge key={r} value={r} label={r} />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
