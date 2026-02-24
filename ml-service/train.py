"""
Train AQI prediction model using Open-Meteo data.
Produces model.pkl for predict.py and app.py.
"""
import os
import pickle
import requests
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from config import AQI_BASE, WEATHER_BASE, HOURLY_AQI, HOURLY_WEATHER, DEFAULT_LAT, DEFAULT_LON, MODEL_PATH, FEATURE_COLS
from model import prepare_features, build_rolling_aqi


def fetch_training_data(lat=DEFAULT_LAT, lon=DEFAULT_LON, past_days=7):
    """Fetch AQI + weather from Open-Meteo for training."""
    aqi_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_AQI,
        "timezone": "auto",
        "past_days": past_days,
        "forecast_days": 5,
    }
    weather_params = {
        "latitude": lat,
        "longitude": lon,
        "hourly": HOURLY_WEATHER,
        "timezone": "auto",
        "forecast_days": 5,
        "past_days": past_days,
    }
    aqi_url = f"{AQI_BASE}?" + "&".join(f"{k}={v}" for k, v in aqi_params.items())
    weather_url = f"{WEATHER_BASE}?" + "&".join(f"{k}={v}" for k, v in weather_params.items())
    aqi = requests.get(aqi_url).json()
    weather = requests.get(weather_url).json()
    return aqi, weather


def build_dataframe(aqi_data, weather_data):
    """Merge AQI and weather hourly into one DataFrame."""
    h_aqi = aqi_data["hourly"]
    h_w = weather_data["hourly"]
    df = pd.DataFrame({
        "time": h_aqi["time"],
        "pm2_5": h_aqi.get("pm2_5", [None] * len(h_aqi["time"])),
        "pm10": h_aqi.get("pm10", [None] * len(h_aqi["time"])),
        "carbon_monoxide": h_aqi.get("carbon_monoxide", [None] * len(h_aqi["time"])),
        "nitrogen_dioxide": h_aqi.get("nitrogen_dioxide", [None] * len(h_aqi["time"])),
        "sulphur_dioxide": h_aqi.get("sulphur_dioxide", [None] * len(h_aqi["time"])),
        "ozone": h_aqi.get("ozone", [None] * len(h_aqi["time"])),
        "us_aqi": h_aqi.get("us_aqi", [None] * len(h_aqi["time"])),
        "temperature": h_w.get("temperature_2m", [None] * len(h_aqi["time"])),
        "humidity": h_w.get("relative_humidity_2m", [None] * len(h_aqi["time"])),
        "wind_speed": h_w.get("wind_speed_10m", [None] * len(h_aqi["time"])),
        "precipitation": h_w.get("precipitation", [None] * len(h_aqi["time"])),
    })
    df = df.rename(columns={
        "carbon_monoxide": "co",
        "nitrogen_dioxide": "no2",
        "sulphur_dioxide": "so2",
        "ozone": "o3",
    })
    df = build_rolling_aqi(df)
    df = prepare_features(df)
    return df


def train(lat=DEFAULT_LAT, lon=DEFAULT_LON, past_days=7):
    aqi_data, weather_data = fetch_training_data(lat, lon, past_days)
    df = build_dataframe(aqi_data, weather_data)
    df = df.dropna(subset=["aqi"])
    available = [c for c in FEATURE_COLS if c in df.columns]
    X = df[available].fillna(0)
    y = df["aqi"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    reg = RandomForestRegressor(n_estimators=100, max_depth=12, random_state=42)
    reg.fit(X_train, y_train)
    score = reg.score(X_test, y_test)
    with open(MODEL_PATH, "wb") as f:
        pickle.dump({"model": reg, "feature_cols": available}, f)
    print(f"Model saved to {MODEL_PATH}, R2={score:.4f}")
    return reg, available


if __name__ == "__main__":
    train()
