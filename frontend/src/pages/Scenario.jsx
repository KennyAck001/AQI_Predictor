import { useState, useEffect } from 'react';
import CitySearch from '../components/CitySearch';
import AQICard from '../components/AQICard';
import { PollutantBarChart } from '../components/Charts';
import { aqiApi, scenarioApi } from '../services/api';
import './Scenario.css';

export default function Scenario() {
  const [city, setCity] = useState({ name: 'Vadodara', lat: 22.3072, lon: 73.1812 });
  const [base, setBase] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [trafficChange, setTrafficChange] = useState(0);
  const [industrialChange, setIndustrialChange] = useState(0);
  const [rainfall, setRainfall] = useState(false);
  const [windChange, setWindChange] = useState(0);
  const [tempChange, setTempChange] = useState(0);

  useEffect(() => {
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

  return (
    <div className="scenario">
      <div className="scenario-header">
        <h1>What-If Scenario Analysis</h1>
        <CitySearch value={city} onChange={setCity} />
      </div>

      <div className="disclaimer-banner">
        The what-if analysis is a scenario-based predictive simulation intended for <strong>educational and analytical purposes</strong>, not official atmospheric modeling.
      </div>

      {base && (
        <section className="scenario-base">
          <h2>Current conditions ({base.location?.city})</h2>
          <AQICard
            aqi={cur?.aqi}
            category={cur?.category}
            healthAdvisory={cur?.healthAdvisory}
          />
        </section>
      )}

      <section className="scenario-controls">
        <h2>Adjust parameters</h2>
        <div className="sliders">
          <label>
            <span>Traffic level change: {trafficChange > 0 ? '+' : ''}{trafficChange}%</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={trafficChange}
              onChange={(e) => setTrafficChange(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Industrial emissions change: {industrialChange > 0 ? '+' : ''}{industrialChange}%</span>
            <input
              type="range"
              min="-50"
              max="50"
              value={industrialChange}
              onChange={(e) => setIndustrialChange(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Wind speed change (km/h): {windChange > 0 ? '+' : ''}{windChange}</span>
            <input
              type="range"
              min="-20"
              max="20"
              value={windChange}
              onChange={(e) => setWindChange(Number(e.target.value))}
            />
          </label>
          <label>
            <span>Temperature change (°C): {tempChange > 0 ? '+' : ''}{tempChange}</span>
            <input
              type="range"
              min="-5"
              max="5"
              value={tempChange}
              onChange={(e) => setTempChange(Number(e.target.value))}
            />
          </label>
          <label className="toggle">
            <input
              type="checkbox"
              checked={rainfall}
              onChange={(e) => setRainfall(e.target.checked)}
            />
            <span>Rainfall (washout)</span>
          </label>
        </div>
        <button type="button" className="run-btn" onClick={runScenario} disabled={loading || !cur}>
          {loading ? 'Running…' : 'Run scenario'}
        </button>
      </section>

      {error && <p className="error">{error}</p>}

      {result && (
        <section className="scenario-result">
          <h2>Scenario result (educational)</h2>
          <div className="comparison-cards">
            <AQICard
              aqi={result.base_aqi}
              category={result.base_category}
              healthAdvisory={result.health_advisory_original}
              subtitle="Original"
            />
            <AQICard
              aqi={result.simulated_aqi}
              category={result.simulated_category}
              healthAdvisory={result.health_advisory_simulated}
              subtitle="Simulated"
            />
          </div>
          {result.simulated_pollutants && (
            <PollutantBarChart pollutants={result.simulated_pollutants} title="Simulated pollutant levels (μg/m³)" />
          )}
          <p className="disclaimer-small">{result.disclaimer}</p>
        </section>
      )}
    </div>
  );
}
