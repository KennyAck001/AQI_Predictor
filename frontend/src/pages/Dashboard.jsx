import { useState, useEffect } from 'react';
import { useAlert } from '../context/AlertContext';
import CitySearch from '../components/CitySearch';
import AQICard from '../components/AQICard';
import { AQILineChart, PollutantBarChart } from '../components/Charts';
import { aqiApi, predictApi } from '../services/api';
import './Dashboard.css';

export default function Dashboard() {
  const [city, setCity] = useState({ name: 'Vadodara', lat: 22.3072, lon: 73.1812 });
  const [current, setCurrent] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [mlPredictions, setMlPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { setAqi } = useAlert();

  useEffect(() => {
    setAqi(current?.current?.aqi ?? null);
  }, [current, setAqi]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      aqiApi.getCurrent(city.name, city.lat, city.lon),
      aqiApi.getForecast(city.name, city.lat, city.lon, 24),
      predictApi.get(city.name, city.lat, city.lon, 24).catch(() => null),
    ])
      .then(([curr, fcast, pred]) => {
        if (cancelled) return;
        setCurrent(curr);
        setForecast(fcast);
        setMlPredictions(pred);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [city]);

  if (loading && !current) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <CitySearch value={city} onChange={setCity} />
        </div>
        <p className="loading">Loading AQI data…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <CitySearch value={city} onChange={setCity} />
        </div>
        <p className="error">Error: {error}</p>
      </div>
    );
  }

  const cur = current?.current;
  const fcastList = forecast?.forecast ?? [];
  const predList = mlPredictions?.predictions ?? [];
  const comparisonData = fcastList.slice(0, 24).map((f, i) => ({
    timestamp: f.timestamp,
    aqi: f.aqi,
    forecastAqi: predList[i]?.aqi,
  }));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Air Quality Dashboard</h1>
        <CitySearch value={city} onChange={setCity} />
      </div>

      <section className="dashboard-current">
        <AQICard
          aqi={cur?.aqi}
          category={cur?.category}
          healthAdvisory={cur?.healthAdvisory}
          subtitle={current?.location?.city}
        />
        <div className="dashboard-meta">
          <p><strong>Location:</strong> {current?.location?.city} ({current?.location?.latitude?.toFixed(2)}°, {current?.location?.longitude?.toFixed(2)}°)</p>
          {cur?.timestamp && <p><strong>Updated:</strong> {new Date(cur.timestamp).toLocaleString()}</p>}
        </div>
      </section>

      {cur?.pollutants && Object.keys(cur.pollutants).length > 0 && (
        <section className="dashboard-section">
          <h2>Current Pollutants (μg/m³)</h2>
          <PollutantBarChart pollutants={cur.pollutants} />
        </section>
      )}

      <section className="dashboard-section">
        <h2>24h Forecast: Actual vs ML Prediction</h2>
        <p className="chart-note">Blue: API forecast. Green dashed: model-based prediction (educational).</p>
        <AQILineChart data={comparisonData} series={['actual', 'forecast']} height={300} />
      </section>
    </div>
  );
}
