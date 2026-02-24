import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  location: {
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  forecastAt: { type: Date, required: true },
  predictedAQI: { type: Number, required: true },
  aqiCategory: { type: String },
  confidenceNote: { type: String },
  pollutantPredictions: {
    pm2_5: { type: Number },
    pm10: { type: Number },
    no2: { type: Number },
    so2: { type: Number },
    o3: { type: Number },
  },
  modelUsed: { type: String, default: 'ensemble' },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

predictionSchema.index({ 'location.city': 1, forecastAt: -1 });

export default mongoose.model('Prediction', predictionSchema);
