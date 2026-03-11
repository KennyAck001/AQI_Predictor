import { useState, useEffect } from 'react';
import CitySearch from '../components/CitySearch';
import { AQILineChart } from '../components/Charts';
import { aqiApi } from '../services/api';
import './Historical.css';

function avg(arr) {
  const valid = arr.filter((v) => v != null && !isNaN(v));
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : null;
}

export default function Historical() {
  const [city, setCity] = useState({ name: 'Vadodara', lat: 22.3072, lon: 73.1812 });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);

  const defaultEnd   = new Date().toISOString().slice(0, 10);
  const defaultStart = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
  const [start, setStart] = useState(defaultStart);
  const [end,   setEnd]   = useState(defaultEnd);

  const loadHistorical = () => {
    if (!start || !end) return;
    setLoading(true);
    setError(null);
    aqiApi
      .getHistorical(city?.name, start, end)
      .then((res) => setRecords(res.records || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const sync = () => {
    setSyncing(true);
    setError(null);
    aqiApi
      .sync(city.name, city.lat, city.lon)
      .then(() => loadHistorical())
      .catch((err) => setError(err.message))
      .finally(() => setSyncing(false));
  };

  // auto-load on city change if records exist
  useEffect(() => {
    if (records.length > 0) loadHistorical();
  }, [city]); // eslint-disable-line

  const aqiValues  = records.map((r) => r.aqi);
  const avgAQI     = avg(aqiValues);
  const minAQI     = aqiValues.length ? Math.min(...aqiValues.filter((v) => v != null)) : null;
  const maxAQI     = aqiValues.length ? Math.max(...aqiValues.filter((v) => v != null)) : null;

  const chartData = records
    .slice(0, 300)
    .reverse()
    .map((r) => ({ timestamp: r.timestamp, aqi: r.aqi }));

  return (
    <div className="historical">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Historical AQI</h1>
          <p className="page-subtitle">Browse stored AQI records by city and date range</p>
        </div>
        <CitySearch value={city} onChange={setCity} />
      </div>

      {/* ── Controls ── */}
      <div className="historical-controls-card glass-strong fade-up">
        <div className="historical-controls-row">
          <div className="date-field">
            <label>From</label>
            <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div className="date-field">
            <label>To</label>
            <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={loadHistorical} disabled={loading}>
            {loading ? '⏳ Loading…' : '🔍 Load Records'}
          </button>
          <button className="btn btn-secondary" onClick={sync} disabled={syncing}>
            {syncing ? '⏳ Syncing…' : '🔄 Sync from API'}
          </button>
        </div>
        <p className="historical-hint">
          💡 Hit <strong>Sync from API</strong> first to fetch data for your chosen city, then filter by date.
        </p>
      </div>

      {error && <div className="error-state">{error}</div>}

      {/* ── Summary stats ── */}
      {records.length > 0 && (
        <>
          <div className="stat-bar fade-up">
            <div className="stat-pill glass">
              <div className="stat-pill-icon">📊</div>
              <div className="stat-pill-value">{avgAQI != null ? Math.round(avgAQI) : '—'}</div>
              <div className="stat-pill-label">Average AQI</div>
            </div>
            <div className="stat-pill glass">
              <div className="stat-pill-icon">✅</div>
              <div className="stat-pill-value" style={{ color: 'var(--good)' }}>
                {minAQI != null ? Math.round(minAQI) : '—'}
              </div>
              <div className="stat-pill-label">Best (Min AQI)</div>
            </div>
            <div className="stat-pill glass">
              <div className="stat-pill-icon">⚠️</div>
              <div className="stat-pill-value" style={{ color: 'var(--unhealthy)' }}>
                {maxAQI != null ? Math.round(maxAQI) : '—'}
              </div>
              <div className="stat-pill-label">Worst (Max AQI)</div>
            </div>
            <div className="stat-pill glass">
              <div className="stat-pill-icon">📋</div>
              <div className="stat-pill-value">{records.length}</div>
              <div className="stat-pill-label">Total Records</div>
            </div>
          </div>

          <div className="historical-chart-card glass-strong fade-up">
            <div className="dashboard-card-header" style={{ marginBottom: 16 }}>
              <span className="dashboard-card-icon">📈</span>
              <span className="dashboard-card-title">AQI Over Time</span>
              <span className="dashboard-card-note">Showing up to 300 records</span>
            </div>
            <AQILineChart data={chartData} series={['actual']} height={320} />
          </div>
        </>
      )}

      {!loading && !syncing && records.length === 0 && (
        <div className="empty-state">
          No records found for this range. Click <strong>Sync from API</strong> to fetch data first.
        </div>
      )}
    </div>
  );
}
