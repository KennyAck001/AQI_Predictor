import mongoose from 'mongoose';

const aqiRecordSchema = new mongoose.Schema({
  location: {
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },
  timestamp: { type: Date, required: true, index: true },
  aqi: { type: Number },
  aqiCategory: { type: String },
  pollutants: {
    pm2_5: { type: Number },
    pm10: { type: Number },
    no2: { type: Number },
    so2: { type: Number },
    co: { type: Number },
    o3: { type: Number },
  },
  weather: {
    temperature: { type: Number },
    humidity: { type: Number },
    windSpeed: { type: Number },
    precipitation: { type: Number },
  },
  source: { type: String, default: 'open-meteo' },
}, { timestamps: true });

aqiRecordSchema.index({ 'location.city': 1, timestamp: -1 });
aqiRecordSchema.index({ timestamp: -1 });

export default mongoose.model('AQIRecord', aqiRecordSchema);
