import { useState, useEffect } from 'react';
import { useAlert } from '../context/AlertContext';
import CitySearch from '../components/CitySearch';
import AQICard from '../components/AQICard';
import { AQILineChart, PollutantBarChart } from '../components/Charts';
import { aqiApi, predictApi } from '../services/api';
import './Dashboard.css';

const POLLUTANT_META = {
  pm2_5: { label: 'PM 2.5', color: '#38bdf8', icon: '💨' },
  pm10:  { label: 'PM 10',  color: '#818cf8', icon: '🌫️' },
  no2:   { label: 'NO₂',   color: '#fb923c', icon: '🟠' },
  so2:   { label: 'SO₂',   color: '#facc15', icon: '🟡' },
  co:    { label: 'CO',    color: '#34d399', icon: '🟢' },
  o3:    { label: 'O₃',    color: '#c084fc', icon: '🟣' },
};

function WeatherPill({ icon, value, label }) {
  if (value == null) return null;
  return (
    <div className="weather-pill glass">
      <div className="weather-pill-icon">{icon}</div>
      <div className="weather-pill-info">
        <div className="weather-pill-value">{value}</div>
        <div className="weather-pill-label">{label}</div>
      </div>
    </div>
  );
}

function PollutantMiniCard({ name, value }) {
  const meta = POLLUTANT_META[name] || { label: name, color: 'var(--accent)', icon: '●' };
  if (value == null) return null;
  return (
    <div className="pollutant-card glass" style={{ borderColor: meta.color + '33' }}>
      <div className="pollutant-name">{meta.icon} {meta.label}</div>
      <div className="pollutant-value" style={{ color: meta.color }}>
        {typeof value === 'number' ? value.toFixed(1) : value}
      </div>
      <div className="pollutant-unit">μg/m³</div>
    </div>
  );
}

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
      aqiApi.getForecast(city.name, city.lat, city.lon, 48),
      predictApi.get(city.name, city.lat, city.lon, 48).catch(() => null),
    ])
      .then(([curr, fcast, pred]) => {
        if (cancelled) return;
        setCurrent(curr);
        setForecast(fcast);
        setMlPredictions(pred);
      })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [city]);

  const cur = current?.current;
  const weather = cur?.weather || {};
  const pollutants = cur?.pollutants || {};
  const fcastList = forecast?.forecast ?? [];
  const predList  = mlPredictions?.predictions ?? [];
  const comparisonData = fcastList.slice(0, 48).map((f, i) => ({
    timestamp: f.timestamp,
    aqi: f.aqi,
    forecastAqi: predList[i]?.aqi,
  }));

  return (
    <div className="dashboard">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Air Quality Dashboard</h1>
          <p className="page-subtitle">Real-time AQI data from Open-Meteo · Updated hourly</p>
        </div>
        <CitySearch value={city} onChange={setCity} />
      </div>

      {loading && !current && <div className="loading-state">Loading air quality data…</div>}
      {error   && <div className="error-state">{error}</div>}

      {cur && (
        <>
          {/* ── Hero card ── */}
          <div className="dashboard-hero glass-strong fade-up">
            <AQICard
              aqi={cur.aqi}
              category={cur.category}
              healthAdvisory={cur.healthAdvisory}
            />
            <div className="weather-snap">
              <div className="weather-snap-title">📍 {current?.location?.city} · Current conditions</div>
              <div className="weather-pills">
                <WeatherPill icon="🌡️" value={weather.temperature != null ? `${weather.temperature.toFixed(1)}°C` : null} label="Temperature" />
                <WeatherPill icon="💧" value={weather.humidity    != null ? `${Math.round(weather.humidity)}%`          : null} label="Humidity" />
                <WeatherPill icon="🌬️" value={weather.windSpeed   != null ? `${weather.windSpeed.toFixed(1)} km/h`      : null} label="Wind Speed" />
                <WeatherPill icon="🌧️" value={weather.precipitation != null ? `${weather.precipitation.toFixed(1)} mm`  : null} label="Precipitation" />
              </div>
              {cur.timestamp && (
                <p className="location-text">
                  📅 Last update: {new Date(cur.timestamp).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* ── Pollutants ── */}
          {Object.keys(pollutants).length > 0 && (
            <section className="section fade-up">
              <div className="section-title">🧪 Pollutant Levels</div>
              <div className="pollutant-grid">
                {Object.entries(pollutants).map(([key, val]) => (
                  <PollutantMiniCard key={key} name={key} value={val} />
                ))}
              </div>
            </section>
          )}

          {/* ── Forecast chart ── */}
          <section className="section fade-up">
            <div className="dashboard-card glass">
              <div className="dashboard-card-header">
                <span className="dashboard-card-icon">📊</span>
                <span className="dashboard-card-title">48-Hour Forecast</span>
                <span className="dashboard-card-note">Blue = API data · Green = ML prediction (educational)</span>
              </div>
              <AQILineChart data={comparisonData} series={['actual', 'forecast']} height={300} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
