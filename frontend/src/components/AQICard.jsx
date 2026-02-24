import './AQICard.css';

function aqiColor(aqi) {
  if (aqi == null) return 'var(--text-muted)';
  if (aqi <= 50) return 'var(--good)';
  if (aqi <= 100) return 'var(--moderate)';
  if (aqi <= 150) return '#db6d28';
  if (aqi <= 200) return 'var(--unhealthy)';
  if (aqi <= 300) return '#a371f7';
  return '#8b0000';
}

export default function AQICard({ aqi, category, healthAdvisory, subtitle }) {
  const color = aqiColor(aqi);
  return (
    <div className="aqi-card">
      <div className="aqi-card-value" style={{ '--aqi-color': color }}>
        {aqi != null ? Math.round(aqi) : '—'}
      </div>
      <div className="aqi-card-label">AQI</div>
      {category && <div className="aqi-card-category">{category}</div>}
      {subtitle && <div className="aqi-card-subtitle">{subtitle}</div>}
      {healthAdvisory && (
        <p className="aqi-card-advisory">{healthAdvisory}</p>
      )}
    </div>
  );
}
