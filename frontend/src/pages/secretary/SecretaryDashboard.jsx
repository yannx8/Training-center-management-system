
import { useEffect, useState } from 'react';
import { secretaryApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
export default function SecretaryDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { secretaryApi.getDashboard().then(r=>setData(r.data)).catch(()=>setError('Load failed')); }, []);
  if (!data && !error) return <PageLoader />;
  if (error) return <ErrorAlert message={error} />;
  return (
    <div className="space-y-6">
      <div><h1 className="page-title">Secretary Dashboard</h1></div>
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-cyan-600">{data.studentCount}</p><p className="text-xs text-gray-500 mt-1">Total Students</p></div>
        <div className="card p-4 text-center"><p className="text-2xl font-bold text-yellow-600">{data.pendingCount}</p><p className="text-xs text-gray-500 mt-1">Pending Complaints</p></div>
      </div>
      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100 font-semibold">Recent Registrations</div>
        <div className="divide-y divide-gray-50">
          {data.recentStudents.map(s => (
            <div key={s.id} className="px-5 py-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{s.user?.fullName}</p>
                <p className="text-xs text-gray-400">{s.matricule} · {s.program?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
