// FILE: src/pages/trainer/TrainerCourses.jsx
import { useEffect, useState } from "react";
import { BookOpen, Clock, Award } from "lucide-react";
import { trainerApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function TrainerCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    trainerApi.getCourses()
      .then(r => { setCourses(r.data); setLoading(false); })
      .catch(() => setError("Failed to load courses"));
  }, []);

  // Group by program → level → semester
  const grouped = {};
  for (const course of courses) {
    if (!course) continue;
    const prog  = course.session?.program?.name || "Unknown Program";
    const level = course.session?.academicLevel?.name || "Unknown Level";
    const sem   = course.session?.semester?.name || "Unknown Semester";
    const key   = `${prog}||${level}||${sem}`;
    if (!grouped[key]) grouped[key] = { prog, level, sem, dept: course.session?.program?.department?.name, courses: [] };
    grouped[key].courses.push(course);
  }

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-title">My Courses</h1>
        <p className="page-subtitle">{courses.length} course{courses.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {courses.length === 0 && (
        <div className="card p-12 text-center">
          <BookOpen size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No courses assigned yet</p>
          <p className="text-sm text-gray-400 mt-1">Contact your administrator to get courses assigned.</p>
        </div>
      )}

      {Object.values(grouped).map(g => (
        <div key={`${g.prog}-${g.level}-${g.sem}`} className="card">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
            <p className="font-semibold text-gray-900">{g.prog}</p>
            <p className="text-xs text-gray-500 mt-0.5">{g.dept} · {g.level} · {g.sem}</p>
          </div>
          <div className="divide-y divide-gray-50">
            {g.courses.map(c => (
              <div key={c.id} className="px-5 py-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <BookOpen size={18} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.code}</p>
                </div>
                <div className="flex gap-4 text-xs text-gray-500 flex-shrink-0">
                  <span className="flex items-center gap-1"><Award size={12} /> {c.credits} cr</span>
                  <span className="flex items-center gap-1"><Clock size={12} /> {c.hoursPerWeek}h/wk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
