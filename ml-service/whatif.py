"""
What-if scenario: apply user inputs to base AQI/pollutants and recompute simulated AQI.
Educational / analytical purposes only.
"""
import numpy as np
from model import us_aqi_from_pm25, aqi_category


def apply_scenario(
    base_aqi,
    base_pollutants,
    traffic_change_percent=0,
    industrial_change_percent=0,
    rainfall=False,
    wind_speed_change=0,
    temperature_change=0,
):
    """
    Apply scenario deltas to pollutant levels and derive simulated AQI.
    base_pollutants: dict with pm2_5, pm10, no2, so2, o3, co (optional).
    """
    pm25 = float(base_pollutants.get("pm2_5") or base_pollutants.get("pm2.5") or 20)
    pm10 = float(base_pollutants.get("pm10") or 40)
    no2 = float(base_pollutants.get("no2") or 30)
    so2 = float(base_pollutants.get("so2") or 10)
    o3 = float(base_pollutants.get("o3") or 40)
    co = float(base_pollutants.get("co") or 0.3)

    # Traffic: scale NO2, PM2.5, PM10
    t = 1 + traffic_change_percent / 100
    no2 *= t
    pm25 *= t
    pm10 *= t

    # Industrial: scale SO2, PM2.5, PM10
    i = 1 + industrial_change_percent / 100
    so2 *= i
    pm25 *= i
    pm10 *= i

    # Rainfall: washout -> lower PM
    if rainfall:
        pm25 *= 0.6
        pm10 *= 0.6
        so2 *= 0.9

    # Wind: dilution -> lower concentrations
    w = 1 - wind_speed_change * 0.02  # e.g. +10 km/h -> -20%
    w = max(0.3, min(1.2, w))
    pm25 *= w
    pm10 *= w
    no2 *= w
    so2 *= w
    o3 *= w

    # Temperature: higher temp can increase O3
    temp_factor = 1 + temperature_change * 0.01
    o3 *= max(0.5, min(1.5, temp_factor))

    # Ensure non-negative
    pm25 = max(0.1, pm25)
    pm10 = max(0.1, pm10)
    no2 = max(0, no2)
    so2 = max(0, so2)
    o3 = max(0, o3)
    co = max(0, co)

    simulated_aqi = us_aqi_from_pm25(pm25)
    simulated_category = aqi_category(simulated_aqi)

    return {
        "simulated_aqi": simulated_aqi,
        "simulated_category": simulated_category,
        "simulated_pollutants": {
            "pm2_5": round(pm25, 2),
            "pm10": round(pm10, 2),
            "no2": round(no2, 2),
            "so2": round(so2, 2),
            "o3": round(o3, 2),
            "co": round(co, 4),
        },
    }
