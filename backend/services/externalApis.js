const AQI_BASE = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const WEATHER_BASE = 'https://api.open-meteo.com/v1/forecast';
const ARCHIVE_BASE = 'https://archive-api.open-meteo.com/v1/archive';

const HOURLY_AQI = 'pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi';
const HOURLY_WEATHER = 'temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation';

/**
 * Fetch current & forecast AQI from Open-Meteo Air Quality API
 */
export async function fetchAQIData(lat, lon, options = {}) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_AQI,
    timezone: options.timezone || 'auto',
    forecast_days: options.forecast_days ?? 5,
  });
  if (options.past_days) params.set('past_days', options.past_days);
  const url = `${AQI_BASE}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`AQI API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch current & forecast weather from Open-Meteo
 */
export async function fetchWeatherData(lat, lon, options = {}) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: HOURLY_WEATHER,
    timezone: options.timezone || 'auto',
    forecast_days: options.forecast_days ?? 5,
  });
  const url = `${WEATHER_BASE}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

/**
 * Fetch historical weather from Open-Meteo Archive
 */
export async function fetchHistoricalWeather(lat, lon, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    start_date: startDate,
    end_date: endDate,
    hourly: HOURLY_WEATHER,
    timezone: 'auto',
  });
  const url = `${ARCHIVE_BASE}?${params}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Archive API error: ${res.status}`);
  return res.json();
}

/**
 * Map Open-Meteo hourly keys to our schema (pm2_5 -> pm2_5, carbon_monoxide -> co, etc.)
 */
export function mapAQIHourlyToRecord(hourly, index, location, weatherHourly = null) {
  const time = hourly.time?.[index];
  const aqi = hourly.us_aqi?.[index] ?? null;
  const category = aqi != null ? getAQICategory(aqi) : null;
  const pollutants = {
    pm2_5: hourly.pm2_5?.[index] ?? null,
    pm10: hourly.pm10?.[index] ?? null,
    no2: hourly.nitrogen_dioxide?.[index] ?? null,
    so2: hourly.sulphur_dioxide?.[index] ?? null,
    co: hourly.carbon_monoxide?.[index] ?? null,
    o3: hourly.ozone?.[index] ?? null,
  };
  let weather = {};
  if (weatherHourly) {
    weather = {
      temperature: weatherHourly.temperature_2m?.[index] ?? null,
      humidity: weatherHourly.relative_humidity_2m?.[index] ?? null,
      windSpeed: weatherHourly.wind_speed_10m?.[index] ?? null,
      precipitation: weatherHourly.precipitation?.[index] ?? null,
    };
  }
  return {
    location: {
      city: location.city,
      latitude: location.latitude,
      longitude: location.longitude,
      timezone: location.timezone || 'Asia/Kolkata',
    },
    timestamp: time ? new Date(time) : new Date(),
    aqi,
    aqiCategory: category,
    pollutants,
    weather,
    source: 'open-meteo',
  };
}

/**
 * US AQI categories (EPA)
 */
export function getAQICategory(aqi) {
  if (aqi == null) return 'Unknown';
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

/**
 * Health advisory message for category
 */
export function getHealthAdvisory(category) {
  const messages = {
    Good: 'Air quality is satisfactory. Enjoy outdoor activities.',
    Moderate: 'Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.',
    'Unhealthy for Sensitive Groups': 'Members of sensitive groups may experience health effects. Consider reducing prolonged outdoor exertion.',
    Unhealthy: 'Everyone may begin to experience health effects. Consider staying indoors and reducing outdoor activities.',
    'Very Unhealthy': 'Health alert: everyone may experience serious health effects. Limit outdoor exposure.',
    Hazardous: 'Health emergency: everyone may experience serious health effects. Stay indoors and avoid outdoor exposure.',
    Severe: 'Health emergency. Follow local advisories.',
    Unknown: 'Insufficient data for health advisory.',
  };
  return messages[category] || messages.Unknown;
}
