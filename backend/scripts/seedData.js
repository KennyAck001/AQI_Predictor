/**
 * Seed script: sync AQI data for Vadodara into the database.
 * Run: node scripts/seedData.js (after backend .env and MongoDB are set)
 */
import 'dotenv/config';
import { connectDB } from '../config/db.js';
import AQIRecord from '../models/AQIRecord.js';
import {
  fetchAQIData,
  fetchWeatherData,
  mapAQIHourlyToRecord,
} from '../services/externalApis.js';

const VADODARA = { city: 'Vadodara', latitude: 22.3072, longitude: 73.1812 };

async function seed() {
  await connectDB();
  const [aqiData, weatherData] = await Promise.all([
    fetchAQIData(VADODARA.latitude, VADODARA.longitude, { forecast_days: 5, past_days: 2 }),
    fetchWeatherData(VADODARA.latitude, VADODARA.longitude, { forecast_days: 5 }),
  ]);
  const hourly = aqiData.hourly;
  const weatherHourly = weatherData.hourly;
  const records = [];
  for (let i = 0; i < (hourly.time?.length ?? 0); i++) {
    records.push(
      mapAQIHourlyToRecord(
        hourly,
        i,
        { ...VADODARA, timezone: aqiData.timezone },
        weatherHourly
      )
    );
  }
  await AQIRecord.insertMany(records);
  console.log(`Seeded ${records.length} AQI records for ${VADODARA.city}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
