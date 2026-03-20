
import { useEffect, useState } from 'react';
import { BookOpen, Users, CalendarDays, Megaphone } from 'lucide-react';
import { hodApi } from '../../api';
import { PageLoader, ErrorAlert, StatCard } from '../../components/ui';

export default function HodDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { hodApi.getDashboard().then(r=>setData(r.data)).catch(()=>setError('Load failed')); }, []);
  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;
  const { department, programs, stats } = data;
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">{department}</h1><p className="page-subtitle">Department Overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-teal-600">{stats.programCount}</p><p className="text-xs text-gray-500 mt-1">Programs</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-amber-600">{stats.trainerCount}</p><p className="text-xs text-gray-500 mt-1">Trainers</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-blue-600">{stats.availabilityCount}</p><p className="text-xs text-gray-500 mt-1">Availability Slots</p></div>
        <div className="card p-4 text-center"><p className="text-sm font-semibold text-green-600 truncate">{stats.activeWeek || 'None'}</p><p className="text-xs text-gray-500 mt-1">Active Week</p></div>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {programs.map(p => (
          <div key={p.id} className="card p-4">
            <p className="font-semibold text-gray-900">{p.name}</p>
            <p className="text-xs text-gray-400 mt-0.5">{p.code} · {p.courseCount} courses</p>
          </div>
        ))}
      </div>
    </div>
  );
}
