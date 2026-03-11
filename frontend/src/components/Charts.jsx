import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from 'recharts';
import './Charts.css';

function formatTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatTimeShort(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
}

function aqiEmoji(val) {
  if (val == null) return '';
  if (val <= 50) return '😊';
  if (val <= 100) return '😐';
  if (val <= 150) return '😷';
  if (val <= 200) return '🤧';
  if (val <= 300) return '😰';
  return '☠️';
}

function AQITooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(11,17,32,0.92)',
      border: '1px solid rgba(255,255,255,0.12)',
      borderRadius: 12,
      padding: '10px 16px',
      fontSize: '0.82rem',
      backdropFilter: 'blur(12px)',
    }}>
      <p style={{ color: 'var(--text-muted)', marginBottom: 6 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} style={{ color: p.color, fontWeight: 600 }}>
          {aqiEmoji(p.value)} {p.name}: <strong>{p.value != null ? Math.round(p.value) : '—'}</strong>
        </p>
      ))}
    </div>
  );
}

export function AQILineChart({ data, series = ['actual', 'forecast'], height = 280 }) {
  const chartData = (data || []).map((d) => ({
    time: formatTimeShort(d.timestamp || d.time),
    full: formatTime(d.timestamp || d.time),
    actual:   d.aqi ?? d.actual,
    forecast: d.forecastAqi ?? d.predictedAqi,
    scenario: d.simulatedAqi,
  }));

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <defs>
            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#58a6ff" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#58a6ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3fb950" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#3fb950" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradScenario" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#d29922" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#d29922" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} interval="preserveStartEnd" />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 10 }} domain={[0, 'auto']} />
          <Tooltip content={<AQITooltip />} labelFormatter={(_, p) => p[0]?.payload?.full} />
          <Legend wrapperStyle={{ fontSize: '0.8rem', color: 'var(--text-muted)' }} />
          {series.includes('actual') && (
            <Area type="monotone" dataKey="actual" name="Actual AQI"
              stroke="#58a6ff" fill="url(#gradActual)" strokeWidth={2} dot={false} />
          )}
          {series.includes('forecast') && (
            <Area type="monotone" dataKey="forecast" name="ML Forecast"
              stroke="#3fb950" fill="url(#gradForecast)" strokeWidth={2} dot={false} strokeDasharray="4 4" />
          )}
          {series.includes('scenario') && (
            <Area type="monotone" dataKey="scenario" name="What-If AQI"
              stroke="#d29922" fill="url(#gradScenario)" strokeWidth={2} dot={false} strokeDasharray="2 2" />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

const POLLUTANT_COLORS = {
  'pm2.5': '#38bdf8',
  pm10:    '#818cf8',
  no2:     '#fb923c',
  so2:     '#facc15',
  co:      '#34d399',
  o3:      '#c084fc',
};

export function PollutantBarChart({ pollutants, title }) {
  const data = pollutants
    ? Object.entries(pollutants)
        .filter(([, v]) => v != null && !Number.isNaN(v))
        .map(([name, value]) => ({ name: name.replace('_', '.'), value: Number(value) }))
    : [];

  if (data.length === 0) return null;

  return (
    <div className="chart-wrap bar-chart">
      {title && <h4 className="chart-title">{title}</h4>}
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'rgba(11,17,32,0.92)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, fontSize: '0.82rem' }} />
          <Bar dataKey="value" name="μg/m³" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.name} fill={POLLUTANT_COLORS[entry.name] || 'var(--accent)'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonOverlay({ actual, forecast, scenario }) {
  const len = Math.max(actual?.length ?? 0, forecast?.length ?? 0, scenario?.length ?? 0);
  const data = [];
  for (let i = 0; i < len; i++) {
    data.push({
      timestamp: actual?.[i]?.timestamp || forecast?.[i]?.timestamp || scenario?.[i]?.timestamp,
      aqi:          actual?.[i]?.aqi,
      forecastAqi:  forecast?.[i]?.aqi ?? forecast?.[i]?.predictedAqi,
      simulatedAqi: scenario?.[i]?.simulatedAqi ?? scenario?.[i]?.aqi,
    });
  }
  return <AQILineChart data={data} series={['actual', 'forecast', 'scenario']} height={320} />;
}
