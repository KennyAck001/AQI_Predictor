import './AQICard.css';

const CATEGORY_META = {
  'Good':                        { emoji: '😊', color: 'var(--good)',          cls: 'good' },
  'Moderate':                    { emoji: '😐', color: 'var(--moderate)',       cls: 'moderate' },
  'Unhealthy for Sensitive Groups': { emoji: '😷', color: 'var(--sensitive)',  cls: 'sensitive' },
  'Unhealthy':                   { emoji: '🤧', color: 'var(--unhealthy)',     cls: 'unhealthy' },
  'Very Unhealthy':              { emoji: '😰', color: 'var(--very-unhealthy)', cls: 'very-unhealthy' },
  'Hazardous':                   { emoji: '☠️', color: 'var(--hazardous)',     cls: 'hazardous' },
};

const DEFAULT_META = { emoji: '🌫️', color: 'var(--text-muted)', cls: '' };

function getStroke(aqi) {
  if (aqi == null) return 'var(--text-muted)';
  if (aqi <= 50)  return 'var(--good)';
  if (aqi <= 100) return 'var(--moderate)';
  if (aqi <= 150) return 'var(--sensitive)';
  if (aqi <= 200) return 'var(--unhealthy)';
  if (aqi <= 300) return 'var(--very-unhealthy)';
  return 'var(--hazardous)';
}

export default function AQICard({ aqi, category, healthAdvisory, subtitle }) {
  const meta = CATEGORY_META[category] || DEFAULT_META;

  // SVG ring calc
  const R = 65;
  const C = 2 * Math.PI * R; // ≈ 408.4
  const pct = aqi != null ? Math.min(aqi / 300, 1) : 0;
  const dash = C * pct;
  const gap  = C - dash;

  const isBad = aqi != null && aqi > 150;

  return (
    <div className="aqi-card">
      <div className={`aqi-ring-wrap${isBad ? ' pulse-bad' : ''}`}>
        <svg className="aqi-ring-svg" viewBox="0 0 160 160">
          <circle className="aqi-ring-track" cx="80" cy="80" r={R} />
          <circle
            className="aqi-ring-fill"
            cx="80" cy="80" r={R}
            stroke={getStroke(aqi)}
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset="0"
          />
        </svg>
        <div className="aqi-ring-center">
          <span className="aqi-value" style={{ color: getStroke(aqi) }}>
            {aqi != null ? Math.round(aqi) : '—'}
          </span>
          <span className="aqi-label">AQI</span>
        </div>
      </div>

      {category && (
        <div className="aqi-badge" style={{ color: meta.color, borderColor: meta.color + '44' }}>
          <span>{meta.emoji}</span>
          {category}
        </div>
      )}

      {subtitle && <div className="aqi-subtitle">{subtitle}</div>}
      {healthAdvisory && <p className="aqi-advisory">{healthAdvisory}</p>}
    </div>
  );
}
