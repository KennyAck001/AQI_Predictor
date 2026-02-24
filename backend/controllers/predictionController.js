const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

/**
 * GET /api/predict?city=Vadodara&lat=22.3072&lon=73.1812&horizon=24
 * horizon: 24 (hours) or 72/120 for 3–5 days
 */
export async function getPrediction(req, res) {
  try {
    const { city = 'Vadodara', lat, lon, horizon = '24' } = req.query;
    const latitude = lat ? parseFloat(lat) : 22.3072;
    const longitude = lon ? parseFloat(lon) : 73.1812;
    const horizonHours = parseInt(horizon, 10) || 24;

    const url = `${ML_SERVICE_URL}/predict?lat=${latitude}&lon=${longitude}&horizon=${horizonHours}`;
    const response = await fetch(url);
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `ML service error: ${response.status}`);
    }
    const data = await response.json();
    res.json({
      location: { city, latitude, longitude },
      predictions: data.predictions || data,
      confidenceNote: data.confidence_note || 'Scenario-based prediction for educational purposes.',
    });
  } catch (err) {
    console.error('getPrediction:', err);
    res.status(502).json({
      error: err.message || 'Prediction service unavailable',
      fallback: 'Ensure ML service is running (python ml-service/app.py)',
    });
  }
}
