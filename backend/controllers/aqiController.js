import AQIRecord from '../models/AQIRecord.js';
import {
  fetchAQIData,
  fetchWeatherData,
  mapAQIHourlyToRecord,
  getAQICategory,
  getHealthAdvisory,
} from '../services/externalApis.js';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * GET /api/aqi/current?city=Vadodara&lat=22.3072&lon=73.1812
 * Returns current AQI and health advisory for a location.
 */
export async function getCurrentAQI(req, res) {
  try {
    const { city = 'Vadodara', lat, lon } = req.query;
    const latitude = lat ? parseFloat(lat) : 22.3072;
    const longitude = lon ? parseFloat(lon) : 73.1812;

    const [aqiData, weatherData] = await Promise.all([
      fetchAQIData(latitude, longitude, { forecast_days: 1 }),
      fetchWeatherData(latitude, longitude, { forecast_days: 1 }),
    ]);

    const hourly = aqiData.hourly;
    const weatherHourly = weatherData.hourly;
    const idx = 0;
    const record = mapAQIHourlyToRecord(
      hourly,
      idx,
      { city, latitude, longitude, timezone: aqiData.timezone },
      weatherHourly
    );
    const aqi = record.aqi ?? hourly.us_aqi?.[0];
    const category = getAQICategory(aqi);
    const healthAdvisory = getHealthAdvisory(category);

    res.json({
      location: { city, latitude, longitude, timezone: aqiData.timezone },
      current: {
        aqi,
        category,
        healthAdvisory,
        pollutants: record.pollutants,
        weather: record.weather,
        timestamp: record.timestamp,
      },
    });
  } catch (err) {
    console.error('getCurrentAQI:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch current AQI' });
  }
}

/**
 * GET /api/aqi/forecast?city=Vadodara&lat=22.3072&lon=73.1812&hours=24
 * Returns AQI forecast (from API and optionally ML).
 */
export async function getForecast(req, res) {
  try {
    const { city = 'Vadodara', lat, lon, hours = 24 } = req.query;
    const latitude = lat ? parseFloat(lat) : 22.3072;
    const longitude = lon ? parseFloat(lon) : 73.1812;
    const forecastHours = Math.min(parseInt(hours, 10) || 24, 120);

    const [aqiData, weatherData] = await Promise.all([
      fetchAQIData(latitude, longitude, { forecast_days: 5 }),
      fetchWeatherData(latitude, longitude, { forecast_days: 5 }),
    ]);

    const hourly = aqiData.hourly;
    const weatherHourly = weatherData.hourly;
    const len = Math.min(forecastHours, hourly.time?.length ?? 0);
    const forecast = [];
    for (let i = 0; i < len; i++) {
      const record = mapAQIHourlyToRecord(
        hourly,
        i,
        { city, latitude, longitude, timezone: aqiData.timezone },
        weatherHourly
      );
      forecast.push({
        timestamp: record.timestamp,
        aqi: record.aqi,
        category: record.aqiCategory,
        pollutants: record.pollutants,
        weather: record.weather,
      });
    }

    res.json({
      location: { city, latitude, longitude },
      forecast,
    });
  } catch (err) {
    console.error('getForecast:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch forecast' });
  }
}

/**
 * POST /api/aqi/store
 * Body: { city, latitude, longitude, records[] } – store AQI records in DB.
 */
export async function storeAQIRecords(req, res) {
  try {
    const { city, latitude, longitude, timezone, records } = req.body;
    if (!city || latitude == null || longitude == null || !Array.isArray(records)) {
      return res.status(400).json({ error: 'Missing city, latitude, longitude, or records array' });
    }
    const docs = records.map((r) => ({
      location: { city, latitude, longitude, timezone: timezone || 'Asia/Kolkata' },
      timestamp: r.timestamp ? new Date(r.timestamp) : new Date(),
      aqi: r.aqi,
      aqiCategory: r.aqiCategory,
      pollutants: r.pollutants || {},
      weather: r.weather || {},
      source: r.source || 'open-meteo',
    }));
    const inserted = await AQIRecord.insertMany(docs);
    res.json({ count: inserted.length, ids: inserted.map((d) => d._id) });
  } catch (err) {
    console.error('storeAQIRecords:', err);
    res.status(500).json({ error: err.message || 'Failed to store records' });
  }
}

/**
 * GET /api/aqi/historical?city=Vadodara&start=2026-01-01&end=2026-01-31
 * Returns stored historical AQI with optional date filter.
 */
export async function getHistorical(req, res) {
  try {
    const { city, start, end } = req.query;
    const filter = {};
    if (city) filter['location.city'] = new RegExp(city, 'i');
    if (start || end) {
      filter.timestamp = {};
      if (start) filter.timestamp.$gte = new Date(start);
      if (end) filter.timestamp.$lte = new Date(end + 'T23:59:59.999Z');
    }
    const records = await AQIRecord.find(filter).sort({ timestamp: -1 }).limit(1000).lean();
    res.json({ records });
  } catch (err) {
    console.error('getHistorical:', err);
    res.status(500).json({ error: err.message || 'Failed to fetch historical data' });
  }
}

/**
 * GET /api/aqi/sync?city=Vadodara&lat=22.3072&lon=73.1812
 * Fetches from Open-Meteo and stores in DB (for building history).
 */
export async function syncAQI(req, res) {
  try {
    const { city = 'Vadodara', lat, lon } = req.query;
    const latitude = lat ? parseFloat(lat) : 22.3072;
    const longitude = lon ? parseFloat(lon) : 73.1812;

    const [aqiData, weatherData] = await Promise.all([
      fetchAQIData(latitude, longitude, { forecast_days: 5, past_days: 2 }),
      fetchWeatherData(latitude, longitude, { forecast_days: 5 }),
    ]);

    const hourly = aqiData.hourly;
    const weatherHourly = weatherData.hourly;
    const records = [];
    const len = hourly.time?.length ?? 0;
    for (let i = 0; i < len; i++) {
      const record = mapAQIHourlyToRecord(
        hourly,
        i,
        { city, latitude, longitude, timezone: aqiData.timezone },
        weatherHourly
      );
      records.push(record);
    }

    await AQIRecord.insertMany(records);
    res.json({ message: 'Synced', count: records.length });
  } catch (err) {
    console.error('syncAQI:', err);
    res.status(500).json({ error: err.message || 'Sync failed' });
  }
}
