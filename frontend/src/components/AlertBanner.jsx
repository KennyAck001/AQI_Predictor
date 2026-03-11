import './AlertBanner.css';

const LEVELS = [
  { min: 301, cls: 'alert-hazardous',     icon: '☠️',  label: 'Hazardous' },
  { min: 201, cls: 'alert-very-unhealthy',icon: '😰',  label: 'Very Unhealthy' },
  { min: 151, cls: 'alert-unhealthy',     icon: '🤧',  label: 'Unhealthy' },
  { min: 101, cls: 'alert-sensitive',     icon: '😷',  label: 'Sensitive Groups' },
  { min:  51, cls: 'alert-moderate',      icon: '😐',  label: 'Moderate' },
];

const MESSAGES = {
  'Hazardous':        'Health emergency — stay indoors, avoid all outdoor activity.',
  'Very Unhealthy':   'Everyone may experience serious health effects. Limit outdoor exposure.',
  'Unhealthy':        'Everyone may begin to experience health effects. Consider staying indoors.',
  'Sensitive Groups': 'Sensitive individuals should avoid prolonged outdoor exertion.',
  'Moderate':         'Unusually sensitive people should consider limiting prolonged exertion.',
};

export default function AlertBanner({ aqi }) {
  if (aqi == null || aqi <= 50) return null;
  const level = LEVELS.find((l) => aqi >= l.min) || LEVELS[LEVELS.length - 1];
  return (
    <div className={`alert-banner ${level.cls}`}>
      <span className="alert-icon">{level.icon}</span>
      <span className="alert-text">
        <strong>{MESSAGES[level.label]}</strong>
      </span>
      <span className="alert-level">AQI {Math.round(aqi)} · {level.label}</span>
    </div>
  );
}
