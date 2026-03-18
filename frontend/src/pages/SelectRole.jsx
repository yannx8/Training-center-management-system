// FILE: src/pages/SelectRole.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { authApi } from "../api";

const ROLE_LABELS = {
  admin: "Administrator", secretary: "Secretary", hod: "Head of Department",
  trainer: "Trainer", student: "Student", parent: "Parent",
};

export default function SelectRole() {
  const { state }             = useLocation();
  const navigate              = useNavigate();
  const { login }             = useAuth();
  const [selected, setSelected] = useState(state?.roles?.[0] || "");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  if (!state?.roles) { navigate("/login"); return null; }

  async function handleConfirm() {
    if (!selected) return;
    setLoading(true); setError("");
    try {
      const res = await authApi.selectRole({ userId: state.userId, role: selected });
      login(res.data.token, res.data.role, res.data.user);
      navigate(`/${selected}`);
    } catch (e) {
      setError(e.response?.data?.message || "Failed to select role");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 rounded-xl mb-3">
            <GraduationCap size={24} className="text-primary-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Select your role</h2>
          <p className="text-sm text-gray-500 mt-1">Hello {state.fullName?.split(" ")[0]}, choose how you want to sign in today</p>
        </div>

        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2">{error}</div>}

        <div className="space-y-2 mb-6">
          {state.roles.map(role => (
            <label key={role}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                selected === role ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-gray-300"
              }`}>
              <input type="radio" name="role" value={role} checked={selected === role}
                onChange={() => setSelected(role)} className="accent-primary-600 w-4 h-4" />
              <span className="text-sm font-medium text-gray-800">{ROLE_LABELS[role] || role}</span>
            </label>
          ))}
        </div>

        <button onClick={handleConfirm} disabled={!selected || loading}
          className="btn-primary w-full justify-center py-2.5">
          {loading ? <Loader2 size={16} className="animate-spin" /> : null}
          {loading ? "Signing in…" : "Continue"}
        </button>

        <button onClick={() => navigate("/login")} className="w-full text-center text-sm text-gray-400 hover:text-gray-600 mt-3">
          ← Back to login
        </button>
      </div>
    </div>
  );
}
