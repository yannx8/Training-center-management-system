// FILE: src/pages/trainer/TrainerCertifications.jsx
import { useEffect, useState } from "react";
import { Award, Clock, Users } from "lucide-react";
import { trainerApi } from "../../api";
import { PageLoader, ErrorAlert } from "../../components/ui";

export default function TrainerCertifications() {
  const [certs, setCerts]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState("");

  useEffect(() => {
    trainerApi.getCertifications()
      .then(r => { setCerts(r.data); setLoading(false); })
      .catch(() => setError("Failed to load certifications"));
  }, []);

  if (loading) return <PageLoader />;
  if (error)   return <ErrorAlert message={error} />;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="page-title">My Certifications</h1>
        <p className="page-subtitle">{certs.length} certification{certs.length !== 1 ? "s" : ""} assigned to you</p>
      </div>

      {certs.length === 0 && (
        <div className="card p-12 text-center">
          <Award size={36} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No certifications assigned</p>
          <p className="text-sm text-gray-400 mt-1">Contact your administrator to get certifications assigned.</p>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {certs.map(cert => (
          <div key={cert.id} className="card p-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Award size={20} className="text-violet-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900">{cert.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{cert.code}</p>
              </div>
            </div>
            {cert.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{cert.description}</p>
            )}
            <div className="flex gap-4 text-xs text-gray-500 pt-2 border-t border-gray-50">
              <span className="flex items-center gap-1"><Clock size={12} /> {cert.durationHours}h total</span>
              <span className="badge-green">{cert.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
