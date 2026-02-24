const API_BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || res.statusText);
  return data;
}

export const aqiApi = {
  getCurrent(city = 'Vadodara', lat, lon) {
    const params = new URLSearchParams({ city });
    if (lat != null) params.set('lat', lat);
    if (lon != null) params.set('lon', lon);
    return request(`/aqi/current?${params}`);
  },
  getForecast(city = 'Vadodara', lat, lon, hours = 24) {
    const params = new URLSearchParams({ city, hours });
    if (lat != null) params.set('lat', lat);
    if (lon != null) params.set('lon', lon);
    return request(`/aqi/forecast?${params}`);
  },
  getHistorical(city, start, end) {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (start) params.set('start', start);
    if (end) params.set('end', end);
    return request(`/aqi/historical?${params}`);
  },
  sync(city = 'Vadodara', lat, lon) {
    const params = new URLSearchParams({ city });
    if (lat != null) params.set('lat', lat);
    if (lon != null) params.set('lon', lon);
    return request(`/aqi/sync?${params}`);
  },
};

export const predictApi = {
  get(city = 'Vadodara', lat, lon, horizon = 24) {
    const params = new URLSearchParams({ city, horizon });
    if (lat != null) params.set('lat', lat);
    if (lon != null) params.set('lon', lon);
    return request(`/predict?${params}`);
  },
};

export const scenarioApi = {
  runWhatIf(body) {
    return request('/scenario/what-if', { method: 'POST', body: JSON.stringify(body) });
  },
};

export const CITIES = [
  { name: 'Vadodara', lat: 22.3072, lon: 73.1812 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Delhi', lat: 28.6139, lon: 77.209 },
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
];
