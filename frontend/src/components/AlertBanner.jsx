import { useState, useEffect } from 'react';
import './AlertBanner.css';

const THRESHOLDS = [
  { min: 201, level: 'Severe', className: 'severe' },
  { min: 151, level: 'Very Poor', className: 'very-poor' },
  { min: 101, level: 'Poor', className: 'poor' },
  { min: 51, level: 'Moderate', className: 'moderate' },
];

export default function AlertBanner({ aqi }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const [levelClass, setLevelClass] = useState('');

  useEffect(() => {
    if (aqi == null) {
      setVisible(false);
      return;
    }
    const t = THRESHOLDS.find((x) => aqi >= x.min);
    if (t) {
      setMessage(`AQI Alert: ${t.level} (${aqi}). Consider limiting outdoor exposure.`);
      setLevelClass(t.className);
      setVisible(true);
    } else {
      setVisible(false);
    }
  }, [aqi]);

  if (!visible) return null;

  return (
    <div className={`alert-banner ${levelClass}`} role="alert">
      <span>{message}</span>
      <button type="button" onClick={() => setVisible(false)} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
