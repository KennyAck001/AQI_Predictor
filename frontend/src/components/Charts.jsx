import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import './Charts.css';

const AQI_COLORS = {
  actual: '#58a6ff',
  forecast: '#3fb950',
  scenario: '#d29922',
};

function formatTime(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit' });
}

export function AQILineChart({ data, series = ['actual', 'forecast'], height = 280 }) {
  const chartData = (data || []).map((d) => ({
    time: formatTime(d.timestamp || d.time),
    full: d.timestamp || d.time,
    actual: d.aqi ?? d.actual,
    forecast: d.forecastAqi ?? d.predictedAqi,
    scenario: d.simulatedAqi,
  }));

  return (
    <div className="chart-wrap" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="time" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} domain={[0, 350]} />
          <Tooltip
            contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            labelFormatter={(_, payload) => payload[0]?.payload?.full && formatTime(payload[0].payload.full)}
          />
          <Legend />
          {series.includes('actual') && (
            <Line type="monotone" dataKey="actual" name="Actual AQI" stroke={AQI_COLORS.actual} dot={false} strokeWidth={2} />
          )}
          {series.includes('forecast') && (
            <Line type="monotone" dataKey="forecast" name="Forecast AQI" stroke={AQI_COLORS.forecast} dot={false} strokeWidth={2} strokeDasharray="4 4" />
          )}
          {series.includes('scenario') && (
            <Line type="monotone" dataKey="scenario" name="What-If AQI" stroke={AQI_COLORS.scenario} dot={false} strokeWidth={2} strokeDasharray="2 2" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

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
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <YAxis tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
          <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)' }} />
          <Bar dataKey="value" fill="var(--accent)" name="μg/m³" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ComparisonOverlay({ actual, forecast, scenario }) {
  const data = [];
  const len = Math.max(
    actual?.length ?? 0,
    forecast?.length ?? 0,
    scenario?.length ?? 0
  );
  for (let i = 0; i < len; i++) {
    data.push({
      time: formatTime(actual?.[i]?.timestamp || forecast?.[i]?.timestamp || scenario?.[i]?.timestamp),
      actual: actual?.[i]?.aqi,
      forecast: forecast?.[i]?.aqi ?? forecast?.[i]?.predictedAqi,
      scenario: scenario?.[i]?.simulatedAqi ?? scenario?.[i]?.aqi,
    });
  }
  return <AQILineChart data={data} series={['actual', 'forecast', 'scenario']} height={320} />;
}
