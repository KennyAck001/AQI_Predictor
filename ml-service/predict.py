"""
Load model and produce AQI predictions given lat/lon and optional horizon.
"""
import pickle
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from config import AQI_BASE, WEATHER_BASE, HOURLY_AQI, HOURLY_WEATHER, DEFAULT_LAT, DEFAULT_LON, MODEL_PATH, FEATURE_COLS
from model import prepare_features, build_rolling_aqi, aqi_category


def load_model():
    import os
    if not os.path.exists(MODEL_PATH):
        return None, []
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    return data["model"], data.get("feature_cols", FEATURE_COLS)


def fetch_live_inputs(lat, lon, hours=24):
    """Fetch current AQI + weather for feature construction."""
    aqi_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_AQI,
        "timezone": "auto",
        "forecast_days": 5,
    }
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_WEATHER,
        "timezone": "auto",
        "forecast_days": 5,
    }
    aqi = requests.get(AQI_BASE, params=aqi_params).json()
    weather = requests.get(WEATHER_BASE, params=weather_params).json()
    h_aqi = aqi["hourly"]
    h_w = weather["hourly"]
    n = min(hours, len(h_aqi["time"]))
    df = pd.DataFrame({
        "time": h_aqi["time"][:n],
        "pm2_5": h_aqi.get("pm2_5", [None] * n)[:n],
        "pm10": h_aqi.get("pm10", [None] * n)[:n],
        "co": h_aqi.get("carbon_monoxide", [None] * n)[:n],
        "no2": h_aqi.get("nitrogen_dioxide", [None] * n)[:n],
        "so2": h_aqi.get("sulphur_dioxide", [None] * n)[:n],
        "o3": h_aqi.get("ozone", [None] * n)[:n],
        "temperature": h_w.get("temperature_2m", [None] * n)[:n],
        "humidity": h_w.get("relative_humidity_2m", [None] * n)[:n],
        "wind_speed": h_w.get("wind_speed_10m", [None] * n)[:n],
        "precipitation": h_w.get("precipitation", [None] * n)[:n],
    })
    df = build_rolling_aqi(df)
    df = prepare_features(df)
    return df


def predict_aqi(lat=DEFAULT_LAT, lon=DEFAULT_LON, horizon=24):
    model, feature_cols = load_model()
    if model is None:
        from train import train
        train(lat, lon)
        model, feature_cols = load_model()
    df = fetch_live_inputs(lat, lon, horizon)
    available = [c for c in feature_cols if c in df.columns]
    X = df[available].fillna(0)
    preds = model.predict(X)
    times = df["time"].tolist()
    result = [
        {
            "timestamp": t,
            "aqi": max(0, min(500, round(float(p)))),
            "category": aqi_category(p),
        }
        for t, p in zip(times, preds)
    ]
    return result
