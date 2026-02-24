const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * POST /api/scenario/what-if
 * Body: {
 *   city, latitude, longitude,
 *   baseAQI, basePollutants,
 *   trafficChangePercent, industrialEmissionsChangePercent,
 *   rainfall, windSpeedChange, temperatureChange
 * }
 */
export async function runWhatIf(req, res) {
  try {
    const body = req.body;
    const url = `${ML_SERVICE_URL}/what-if`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lat: body.latitude ?? 22.3072,
        lon: body.longitude ?? 73.1812,
        base_aqi: body.baseAQI,
        base_pollutants: body.basePollutants || {},
        traffic_change_percent: body.trafficChangePercent ?? 0,
        industrial_change_percent: body.industrialEmissionsChangePercent ?? 0,
        rainfall: !!body.rainfall,
        wind_speed_change: body.windSpeedChange ?? 0,
        temperature_change: body.temperatureChange ?? 0,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `ML service error: ${response.status}`);
    }
    const data = await response.json();
    res.json({
      disclaimer: 'Scenario-Based Prediction (Educational). Not official atmospheric modeling.',
      ...data,
    });
  } catch (err) {
    console.error('runWhatIf:', err);
    res.status(502).json({
      error: err.message || 'What-if service unavailable',
      disclaimer: 'Scenario-Based Prediction (Educational). Not official atmospheric modeling.',
    });
  }
}
