# Open-Meteo API endpoints (no API key required)
AQI_BASE = "https://air-quality-api.open-meteo.com/v1/air-quality"
WEATHER_BASE = "https://api.open-meteo.com/v1/forecast"
ARCHIVE_BASE = "https://archive-api.open-meteo.com/v1/archive"

HOURLY_AQI = "pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone,us_aqi"
HOURLY_WEATHER = "temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation"

# Default location: Vadodara
DEFAULT_LAT = 22.3072
DEFAULT_LON = 73.1812

# Model
MODEL_PATH = "model.pkl"
FEATURE_COLS = [
    "pm2_5", "pm10", "no2", "so2", "o3", "co",
    "temperature", "humidity", "wind_speed", "precipitation",
    "hour_sin", "hour_cos", "dow_sin", "dow_cos",
]
