
// FILE: src/pages/trainer/TrainerDashboard.jsx
import { useEffect, useState } from 'react';
import { trainerApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';

export default function TrainerDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { trainerApi.getDashboard().then(r=>setData(r.data)).catch(()=>setError('Load failed')); }, []);
  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Trainer Dashboard</h1><p className="page-subtitle">Your teaching overview</p></div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-amber-600">{data.courseCount}</p><p className="text-xs text-gray-500 mt-1">Courses</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-violet-600">{data.certCount}</p><p className="text-xs text-gray-500 mt-1">Certifications</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-blue-600">{data.upcomingAcademicSlots?.length || 0}</p><p className="text-xs text-gray-500 mt-1">Academic Sessions</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-red-500">{data.pendingComplaints}</p><p className="text-xs text-gray-500 mt-1">Pending Complaints</p></div>
      </div>
    </div>
  );
}
