import { useState, useEffect } from 'react';
import CitySearch from '../components/CitySearch';
import AQICard from '../components/AQICard';
import { aqiApi, scenarioApi } from '../services/api';
import './Scenario.css';

const SLIDERS = [
  {
    key: 'trafficChange',
    icon: '🚗',
    label: 'Traffic Level',
    unit: '%',
    min: -50, max: 50,
    hint: 'Higher traffic → more NO₂ & PM',
  },
  {
    key: 'industrialChange',
    icon: '🏭',
    label: 'Industrial Emissions',
    unit: '%',
    min: -50, max: 50,
    hint: 'More industry → higher SO₂ & PM',
  },
  {
    key: 'windChange',
    icon: '💨',
    label: 'Wind Speed Change',
    unit: ' km/h',
    min: -20, max: 20,
    hint: 'Stronger wind dilutes pollutants',
  },
  {
    key: 'tempChange',
    icon: '🌡️',
    label: 'Temperature Change',
    unit: '°C',
    min: -5, max: 5,
    hint: 'Higher temp increases O₃ levels',
  },
];

export default function Scenario() {
  const [city, setCity] = useState({ name: 'Vadodara', lat: 22.3072, lon: 73.1812 });
  const [base, setBase]     = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState(null);

  const [trafficChange,    setTrafficChange]    = useState(0);
  const [industrialChange, setIndustrialChange] = useState(0);
  const [windChange,       setWindChange]       = useState(0);
  const [tempChange,       setTempChange]       = useState(0);
  const [rainfall,         setRainfall]         = useState(false);

  const state = { trafficChange, industrialChange, windChange, tempChange };
  const setters = { trafficChange: setTrafficChange, industrialChange: setIndustrialChange, windChange: setWindChange, tempChange: setTempChange };

  useEffect(() => {
    setBase(null);
    setResult(null);
    aqiApi
      .getCurrent(city.name, city.lat, city.lon)
      .then((res) => setBase(res))
      .catch((err) => setError(err.message));
  }, [city]);

  const runScenario = () => {
    if (!base?.current) return;
    setLoading(true);
    setError(null);
    scenarioApi
      .runWhatIf({
        city: city.name,
        latitude: city.lat,
        longitude: city.lon,
        baseAQI: base.current.aqi,
        basePollutants: base.current.pollutants || {},
        trafficChangePercent: trafficChange,
        industrialEmissionsChangePercent: industrialChange,
        rainfall,
        windSpeedChange: windChange,
        temperatureChange: tempChange,
      })
      .then((data) => setResult(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const cur = base?.current;
  const delta = result ? result.simulated_aqi - result.base_aqi : 0;
  const impactClass = delta < -2 ? 'improved' : delta > 2 ? 'worsened' : 'same';
  const impactLabel = delta < -2
    ? `✅ AQI improved by ${Math.abs(Math.round(delta))} points`
    : delta > 2
    ? `⚠️ AQI worsened by ${Math.round(delta)} points`
    : '➡️ No significant change';

  return (
    <div className="scenario">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">What-If Scenario Analysis</h1>
          <p className="page-subtitle">Simulate how changes in emission sources affect air quality</p>
        </div>
        <CitySearch value={city} onChange={setCity} />
      </div>

      {/* ── Disclaimer ── */}
      <div className="disclaimer-ribbon">
        <span>🔬</span>
        <span>
          This is a <strong>scenario-based simulation</strong> for educational purposes.
          Results are estimates and not a substitute for official atmospheric modeling.
        </span>
      </div>

      {/* ── Slider cards ── */}
      <section className="section">
        <div className="section-title">⚙️ Adjust Parameters</div>
        <div className="sliders-grid">
          {SLIDERS.map((s) => {
            const val = state[s.key];
            const formatted = (val > 0 ? '+' : '') + val + s.unit;
            return (
              <div key={s.key} className="slider-card glass">
                <div className="slider-card-header">
                  <div className="slider-card-icon">{s.icon}</div>
                  <div className="slider-card-label">{s.label}</div>
                  <div className="slider-card-value">{formatted}</div>
                </div>
                <input
                  type="range"
                  min={s.min} max={s.max}
                  value={val}
                  onChange={(e) => setters[s.key](Number(e.target.value))}
                />
                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{s.hint}</div>
              </div>
            );
          })}

          {/* Rainfall toggle card */}
          <div className="slider-card glass">
            <div className="slider-card-header">
              <div className="slider-card-icon">🌧️</div>
              <div className="slider-card-label">Rainfall Washout</div>
            </div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={rainfall}
                onChange={(e) => setRainfall(e.target.checked)}
              />
              <span>{rainfall ? '🟢 Rain active — PM reduced ~40%' : 'No rainfall'}</span>
            </label>
            <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
              Rain washes out PM2.5, PM10 and SO₂
            </div>
          </div>
        </div>
      </section>

      {/* ── Run button ── */}
      <div className="run-row">
        <button
          className="btn btn-primary"
          style={{ padding: '14px 40px', fontSize: '1rem' }}
          onClick={runScenario}
          disabled={loading || !cur}
        >
          {loading ? '⏳ Running simulation…' : '🚀 Run Scenario'}
        </button>
      </div>

      {error && <div className="error-state">{error}</div>}

      {/* ── Result ── */}
      {result && (
        <section className="section fade-up">
          <div className="section-title">📋 Simulation Result</div>
          <div className="scenario-result-card glass-strong">
            <div className="comparison-grid">
              <div className="comparison-side">
                <div className="comparison-label">🌍 Current (Before)</div>
                <AQICard
                  aqi={result.base_aqi}
                  category={result.base_category}
                  healthAdvisory={result.health_advisory_original}
                />
              </div>
              <div className="comparison-side">
                <div className="comparison-label">🔮 Simulated (After)</div>
                <AQICard
                  aqi={result.simulated_aqi}
                  category={result.simulated_category}
                  healthAdvisory={result.health_advisory_simulated}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <div className={`impact-badge ${impactClass}`}>
                {impactLabel}
              </div>
            </div>

            <p className="disclaimer-small">{result.disclaimer}</p>
          </div>
        </section>
      )}
    </div>
  );
}
