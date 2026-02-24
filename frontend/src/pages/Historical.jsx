import { useState, useEffect } from 'react';
import CitySearch from '../components/CitySearch';
import { AQILineChart, PollutantBarChart } from '../components/Charts';
import { aqiApi } from '../services/api';
import './Historical.css';

export default function Historical() {
  const [city, setCity] = useState({ name: 'Vadodara', lat: 22.3072, lon: 73.1812 });
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    if (!start) setStart(startDate.toISOString().slice(0, 10));
    if (!end) setEnd(endDate.toISOString().slice(0, 10));
  }, []);

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
      .then(() => {
        loadHistorical();
      })
      .catch((err) => setError(err.message))
      .finally(() => setSyncing(false));
  };

  const chartData = records.map((r) => ({
    timestamp: r.timestamp,
    aqi: r.aqi,
  })).slice(0, 200);

  const latestPollutants = records.length ? records[0].pollutants : null;

  return (
    <div className="historical">
      <div className="historical-header">
        <h1>Historical AQI</h1>
        <CitySearch value={city} onChange={setCity} />
      </div>

      <div className="historical-controls">
        <label>
          Start <input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          End <input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
        <button type="button" onClick={loadHistorical} disabled={loading}>
          {loading ? 'Loading…' : 'Load'}
        </button>
        <button type="button" onClick={sync} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync from API'}
        </button>
      </div>

      <p className="historical-hint">
        Use &quot;Sync from API&quot; to fetch and store recent AQI data for the selected city, then filter by date range.
      </p>

      {error && <p className="error">{error}</p>}

      {records.length > 0 && (
        <>
          <section className="dashboard-section">
            <h2>AQI Over Time</h2>
            <AQILineChart data={chartData} series={['actual']} height={300} />
          </section>
          {latestPollutants && (
            <section className="dashboard-section">
              <h2>Latest Record: Pollutants</h2>
              <PollutantBarChart pollutants={latestPollutants} />
            </section>
          )}
        </>
      )}

      {!loading && records.length === 0 && start && end && (
        <p className="no-data">No historical records for this range. Click &quot;Sync from API&quot; to fetch data first.</p>
      )}
    </div>
  );
}
