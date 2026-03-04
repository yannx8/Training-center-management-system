import '../styles/StatCard.css';

export default function StatCard({ title, value, icon, trend, trendLabel }) {
  return (
    <div className="stat-card">
      <div className="stat-card-content">
        <div>
          <div className="stat-card-title">{title}</div>
          <div className="stat-card-value">{value ?? '—'}</div>
          {trend !== undefined && (
            <div className={`stat-card-trend ${trend >= 0 ? 'up' : 'down'}`}>
              {trend >= 0 ? '↗' : '↘'} {trendLabel}
            </div>
          )}
        </div>
        <div className="stat-card-icon">{icon}</div>
      </div>
    </div>
  );
}