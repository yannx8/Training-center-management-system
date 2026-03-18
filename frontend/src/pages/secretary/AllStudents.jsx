
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { secretaryApi } from '../../api';
import Table from '../../components/ui/Table';
import { PageLoader, SectionHeader } from '../../components/ui';
export default function AllStudents() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { secretaryApi.getStudents().then(r=>{ setStudents(r.data); setLoading(false); }); }, []);
  const filtered = students.filter(s =>
    s.user?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    s.matricule?.toLowerCase().includes(search.toLowerCase())
  );
  const cols = [
    { key:'matricule', label:'Matricule' },
    { key:'name', label:'Name', render: s => s.user?.fullName },
    { key:'email', label:'Email', render: s => s.user?.email },
    { key:'program', label:'Program', render: s => s.program?.name || '—' },
    { key:'status', label:'Status', render: s => s.user?.status },
  ];
  if (loading) return <PageLoader />;
  return (
    <div className="space-y-4">
      <SectionHeader title="All Students" subtitle={filtered.length + ' students'} />
      <div className="card p-4"><div className="relative max-w-xs"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input className="input pl-9" placeholder="Search…" value={search} onChange={e=>setSearch(e.target.value)} /></div></div>
      <Table columns={cols} data={filtered} />
    </div>
  );
}
