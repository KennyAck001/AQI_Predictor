import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import aqiRoutes from './routes/aqiRoutes.js';
import predictionRoutes from './routes/predictionRoutes.js';
import scenarioRoutes from './routes/scenarioRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/aqi', aqiRoutes);
app.use('/api/predict', predictionRoutes);
app.use('/api/scenario', scenarioRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

await connectDB();

app.listen(PORT, () => {
  console.log(`Backend running at http://localhost:${PORT}`);
});
