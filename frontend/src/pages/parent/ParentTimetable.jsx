// FILE: frontend/src/pages/parent/ParentTimetable.jsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { parentApi } from '../../api';
import { PageLoader, ErrorAlert } from '../../components/ui';
import TimetableGrid from '../../components/ui/TimetableGrid';
import { useTranslation } from 'react-i18next';

export default function ParentTimetable() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [children, setChildren] = useState([]);
  const [childId, setChildId]   = useState(searchParams.get('childId') || '');
  const [data, setData]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  useEffect(() => {
    parentApi.getChildren().then(r => {
      const kids = r.data || [];
      setChildren(kids);
      if (!childId && kids.length > 0) setChildId(String(kids[0].id));
      setLoading(false);
    }).catch(() => setError(t('common.failedLoad', 'Failed to load children')));
  }, []);

  useEffect(() => {
    if (!childId) return;
    setData(null);
    parentApi.getChildTimetable(childId)
      .then(r => setData(r.data))
      .catch(() => setError(t('common.failedLoad', 'Failed to load timetable')));
  }, [childId]);

  // Combine academic and cert slots for the grid
  const academicSlots = (data?.slots || []).map(s => ({
    ...s,
    type:        'academic',
    subject:     s.course?.name,
    weekLabel:   s.timetable?.academicWeek?.label,
    levelName:   s.course?.session?.academicLevel?.name,
    semesterName: s.course?.session?.semester?.name,
  }));

  const certSlots = (data?.certSlots || []).map(s => ({
    ...s,
    type:      'certification',
    subject:   s.certification?.name,
    weekLabel: s.academicWeek?.label,
  }));

  const allSessions = [...academicSlots, ...certSlots];
  const child = data?.child || children.find(c => String(c.id) === String(childId));

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <h1 className="page-title">{t('timetable.parentTimetableTitle', "Child's Timetable")}</h1>
          {child && (
            <p className="page-subtitle">{child.user?.fullName} · {child.matricule}</p>
          )}
        </div>

        {children.length > 1 && (
          <div>
            <label className="label">{t('timetable.selectChild', 'Select Child')}</label>
            <select className="select" value={childId} onChange={e => setChildId(e.target.value)}>
              {children.map(c => (
                <option key={c.id} value={c.id}>{c.user?.fullName}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {!childId && (
        <div className="card p-10 text-center text-gray-400">
          <p>{t('timetable.selectChild', 'Select a child to view their timetable')}</p>
        </div>
      )}

      {childId && allSessions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <span className="bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 text-xs font-semibold">
            {academicSlots.length} {t('timetable.academic', 'Academic')}
          </span>
          <span className="bg-violet-50 text-violet-700 border border-violet-200 rounded-full px-3 py-1 text-xs font-semibold">
            {certSlots.length} {t('timetable.certification', 'Certification')}
          </span>
        </div>
      )}

      {childId && (
        <TimetableGrid
          sessions={allSessions}
          getDay={s => s.dayOfWeek}
          getType={s => s.type}
          emptyMessage={t('timetable.noTimetableYet', 'No timetable published for this student yet.')}
        />
      )}
    </div>
  );
}