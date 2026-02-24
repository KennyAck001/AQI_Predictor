"""
AQI prediction model: feature preparation and US AQI calculation.
Uses Random Forest as baseline; can be extended with LSTM.
"""
import numpy as np
import pandas as pd
from datetime import datetime


def us_aqi_from_pm25(pm25_24h_ugm3):
    """EPA breakpoints for PM2.5 24h (μg/m³) -> US AQI."""
    bp = [
        (0, 12.0, 0, 50),
        (12.1, 35.4, 51, 100),
        (35.5, 55.4, 101, 150),
        (55.5, 150.4, 151, 200),
        (150.5, 250.4, 201, 300),
        (250.5, 350.4, 301, 400),
        (350.5, 500.4, 401, 500),
    ]
    if pd.isna(pm25_24h_ugm3) or pm25_24h_ugm3 <= 0:
        return 0
    for c_lo, c_hi, i_lo, i_hi in bp:
        if c_lo <= pm25_24h_ugm3 <= c_hi:
            return round(i_lo + (i_hi - i_lo) * (pm25_24h_ugm3 - c_lo) / (c_hi - c_lo))
    return 500


def aqi_category(aqi):
    if aqi is None or np.isnan(aqi):
        return "Unknown"
    if aqi <= 50:
        return "Good"
    if aqi <= 100:
        return "Moderate"
    if aqi <= 150:
        return "Unhealthy for Sensitive Groups"
    if aqi <= 200:
        return "Unhealthy"
    if aqi <= 300:
        return "Very Unhealthy"
    return "Hazardous"


def prepare_features(df):
    """Build feature matrix for model. Expects columns: pm2_5, pm10, no2, so2, o3, co, temperature, humidity, wind_speed, precipitation, and optional time."""
    out = df.copy()
    if "time" in out.columns:
        t = pd.to_datetime(out["time"])
        out["hour_sin"] = np.sin(2 * np.pi * t.dt.hour / 24)
        out["hour_cos"] = np.cos(2 * np.pi * t.dt.hour / 24)
        out["dow_sin"] = np.sin(2 * np.pi * t.dt.dayofweek / 7)
        out["dow_cos"] = np.cos(2 * np.pi * t.dt.dayofweek / 7)
    else:
        out["hour_sin"] = 0
        out["hour_cos"] = 1
        out["dow_sin"] = 0
        out["dow_cos"] = 1
    return out


def build_rolling_aqi(df, window=24):
    """Add rolling 24h mean PM2.5 and derived AQI for target."""
    out = df.copy()
    if "pm2_5" in out.columns:
        out["pm25_24h"] = out["pm2_5"].rolling(window=window, min_periods=1).mean()
        out["aqi"] = out["pm25_24h"].map(us_aqi_from_pm25)
    return out
