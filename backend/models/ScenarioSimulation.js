import mongoose from 'mongoose';

const scenarioSimulationSchema = new mongoose.Schema({
  location: {
    city: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
  },
  baseAQI: { type: Number, required: true },
  baseCategory: { type: String },
  basePollutants: {
    pm2_5: { type: Number },
    pm10: { type: Number },
    no2: { type: Number },
    so2: { type: Number },
    o3: { type: Number },
  },
  scenarioInputs: {
    trafficChangePercent: { type: Number, default: 0 },
    industrialEmissionsChangePercent: { type: Number, default: 0 },
    rainfall: { type: Boolean, default: false },
    windSpeedChange: { type: Number, default: 0 },
    temperatureChange: { type: Number, default: 0 },
  },
  simulatedAQI: { type: Number, required: true },
  simulatedCategory: { type: String },
  simulatedPollutants: {
    pm2_5: { type: Number },
    pm10: { type: Number },
    no2: { type: Number },
    so2: { type: Number },
    o3: { type: Number },
  },
  healthAdvisoryOriginal: { type: String },
  healthAdvisorySimulated: { type: String },
  isEducational: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('ScenarioSimulation', scenarioSimulationSchema);
