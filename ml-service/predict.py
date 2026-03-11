"""
Load model and produce AQI predictions given lat/lon and optional horizon.

Fetches past_days=2 alongside forecast so lag features can be computed on
real observed values before slicing down to the requested horizon.
"""
import pickle
import requests
import pandas as pd
import numpy as np
from datetime import datetime, timezone
from config import (
    AQI_BASE, WEATHER_BASE, HOURLY_AQI, HOURLY_WEATHER,
    DEFAULT_LAT, DEFAULT_LON, MODEL_PATH, FEATURE_COLS,
)
from model import prepare_features, build_rolling_aqi, compute_lag_features, aqi_category

# How many past days to include so lag features are valid at prediction time
_PRED_PAST_DAYS = 2


def load_model():
    import os
    if not os.path.exists(MODEL_PATH):
        return None, []
    with open(MODEL_PATH, "rb") as f:
        data = pickle.load(f)
    return data["model"], data.get("feature_cols", FEATURE_COLS)


def fetch_live_inputs(lat, lon, horizon=24):
    """Fetch past 2 days + forecast from Open-Meteo for feature construction."""
    aqi_params = {
        "latitude":     lat,
        "longitude":    lon,
        "hourly":       HOURLY_AQI,
        "timezone":     "auto",
        "past_days":    _PRED_PAST_DAYS,
        "forecast_days": 5,
    }
    weather_params = {
        "latitude":     lat,
        "longitude":    lon,
        "hourly":       HOURLY_WEATHER,
        "timezone":     "auto",
        "past_days":    _PRED_PAST_DAYS,
        "forecast_days": 5,
    }
    aqi     = requests.get(AQI_BASE,     params=aqi_params).json()
    weather = requests.get(WEATHER_BASE, params=weather_params).json()
    h_aqi = aqi["hourly"]
    h_w   = weather["hourly"]
    total = len(h_aqi["time"])

    df = pd.DataFrame({
        "time":        h_aqi["time"],
        "pm2_5":       h_aqi.get("pm2_5",            [None] * total),
        "pm10":        h_aqi.get("pm10",             [None] * total),
        "co":          h_aqi.get("carbon_monoxide",  [None] * total),
        "no2":         h_aqi.get("nitrogen_dioxide", [None] * total),
        "so2":         h_aqi.get("sulphur_dioxide",  [None] * total),
        "o3":          h_aqi.get("ozone",            [None] * total),
        "us_aqi":      h_aqi.get("us_aqi",           [None] * total),
        "temperature": h_w.get("temperature_2m",       [None] * total),
        "humidity":    h_w.get("relative_humidity_2m", [None] * total),
        "wind_speed":  h_w.get("wind_speed_10m",       [None] * total),
        "precipitation": h_w.get("precipitation",      [None] * total),
    })

    # Sort and build features over the FULL window (past + future)
    df = df.sort_values("time").reset_index(drop=True)
    df = build_rolling_aqi(df)
    df = prepare_features(df)
    df = compute_lag_features(df, aqi_col="us_aqi")  # lags computed on real past data

    # Identify forecast rows (time >= now) and slice to horizon
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:00")
    future_mask = pd.to_datetime(df["time"]) >= pd.to_datetime(now_str)
    df_forecast = df[future_mask].head(horizon).reset_index(drop=True)

    # Fallback: if timezone filtering is off, just take the last `horizon` rows
    if len(df_forecast) == 0:
        df_forecast = df.tail(horizon).reset_index(drop=True)

    return df_forecast


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
            "aqi":       max(0, min(500, round(float(p)))),
            "category":  aqi_category(p),
        }
        for t, p in zip(times, preds)
    ]
    return result
