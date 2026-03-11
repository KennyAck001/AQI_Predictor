"""
Train AQI prediction model using Open-Meteo data.
Produces model.pkl for predict.py and app.py.

Improvements over v1:
- Target is Open-Meteo us_aqi (multi-pollutant) instead of PM2.5-derived AQI
- 90 days of training data instead of 7
- Lag features: us_aqi at -1h, -6h, -24h
- Time-based train/test split (no future leakage)
"""
import os
import pickle
import requests
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from config import (
    AQI_BASE, WEATHER_BASE, HOURLY_AQI, HOURLY_WEATHER,
    DEFAULT_LAT, DEFAULT_LON, MODEL_PATH, FEATURE_COLS, TRAIN_PAST_DAYS,
)
from model import prepare_features, build_rolling_aqi, compute_lag_features


def fetch_training_data(lat=DEFAULT_LAT, lon=DEFAULT_LON, past_days=TRAIN_PAST_DAYS):
    """Fetch AQI + weather from Open-Meteo for training."""
    aqi_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_AQI,
        "timezone": "auto",
        "past_days": past_days,
        "forecast_days": 1,
    }
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_WEATHER,
        "timezone": "auto",
        "past_days": past_days,
        "forecast_days": 1,
    }
    aqi_url     = f"{AQI_BASE}?"     + "&".join(f"{k}={v}" for k, v in aqi_params.items())
    weather_url = f"{WEATHER_BASE}?" + "&".join(f"{k}={v}" for k, v in weather_params.items())
    aqi     = requests.get(aqi_url).json()
    weather = requests.get(weather_url).json()
    return aqi, weather


def build_dataframe(aqi_data, weather_data):
    """Merge AQI and weather hourly into one DataFrame."""
    h_aqi = aqi_data["hourly"]
    h_w   = weather_data["hourly"]
    n = len(h_aqi["time"])
    df = pd.DataFrame({
        "time":             h_aqi["time"],
        "pm2_5":            h_aqi.get("pm2_5",            [None] * n),
        "pm10":             h_aqi.get("pm10",             [None] * n),
        "carbon_monoxide":  h_aqi.get("carbon_monoxide",  [None] * n),
        "nitrogen_dioxide": h_aqi.get("nitrogen_dioxide", [None] * n),
        "sulphur_dioxide":  h_aqi.get("sulphur_dioxide",  [None] * n),
        "ozone":            h_aqi.get("ozone",            [None] * n),
        "us_aqi":           h_aqi.get("us_aqi",           [None] * n),
        "temperature":      h_w.get("temperature_2m",         [None] * n),
        "humidity":         h_w.get("relative_humidity_2m",   [None] * n),
        "wind_speed":       h_w.get("wind_speed_10m",         [None] * n),
        "precipitation":    h_w.get("precipitation",          [None] * n),
    })
    df = df.rename(columns={
        "carbon_monoxide":  "co",
        "nitrogen_dioxide": "no2",
        "sulphur_dioxide":  "so2",
        "ozone":            "o3",
    })
    # Sort chronologically (API usually returns sorted, but be safe)
    df = df.sort_values("time").reset_index(drop=True)
    # Feature engineering
    df = build_rolling_aqi(df)      # adds pm25_24h, aqi (kept as aux, not target)
    df = prepare_features(df)       # adds hour/dow cyclical features
    df = compute_lag_features(df, aqi_col="us_aqi")  # adds us_aqi_lag_1h/6h/24h
    return df


def train(lat=DEFAULT_LAT, lon=DEFAULT_LON, past_days=TRAIN_PAST_DAYS):
    print(f"Fetching {past_days} days of training data…")
    aqi_data, weather_data = fetch_training_data(lat, lon, past_days)
    df = build_dataframe(aqi_data, weather_data)

    # ── Target: use Open-Meteo's real multi-pollutant us_aqi ──
    df = df.dropna(subset=["us_aqi"])
    y = df["us_aqi"]

    # ── Features ──
    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available].fillna(0)

    # ── Time-based split (no future leakage) — last 20% as test ──
    split = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split], X.iloc[split:]
    y_train, y_test = y.iloc[:split], y.iloc[split:]

    print(f"Training on {len(X_train)} rows, testing on {len(X_test)} rows…")
    reg = RandomForestRegressor(n_estimators=150, max_depth=15, random_state=42, n_jobs=-1)
    reg.fit(X_train, y_train)
    score = reg.score(X_test, y_test)

    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": reg, "feature_cols": available}, f)
    print(f"✅ Model saved to {MODEL_PATH}  R²={score:.4f}  features={available}")
    return reg, available


if __name__ == "__main__":
    train()
