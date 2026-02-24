"""
Flask microservice: /predict and /what-if for AQI forecasting and scenario analysis.
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

from predict import predict_aqi, load_model
from whatif import apply_scenario
from model import aqi_category

app = Flask(__name__)
CORS(app)

DEFAULT_LAT = 22.3072
DEFAULT_LON = 73.1812


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["GET"])
def predict():
    lat = float(request.args.get("lat", DEFAULT_LAT))
    lon = float(request.args.get("lon", DEFAULT_LON))
    horizon = int(request.args.get("horizon", 24))
    horizon = min(max(horizon, 1), 120)
    try:
        predictions = predict_aqi(lat, lon, horizon)
        return jsonify({
            "predictions": predictions,
            "confidence_note": "Model-based forecast for educational purposes. Not a substitute for official air quality data.",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/what-if", methods=["POST"])
def what_if():
    data = request.get_json() or {}
    lat = float(data.get("lat", DEFAULT_LAT))
    lon = float(data.get("lon", DEFAULT_LON))
    base_aqi = data.get("base_aqi")
    base_pollutants = data.get("base_pollutants") or {}
    traffic = float(data.get("traffic_change_percent", 0))
    industrial = float(data.get("industrial_change_percent", 0))
    rainfall = bool(data.get("rainfall", False))
    wind = float(data.get("wind_speed_change", 0))
    temp = float(data.get("temperature_change", 0))

    result = apply_scenario(
        base_aqi=base_aqi,
        base_pollutants=base_pollutants,
        traffic_change_percent=traffic,
        industrial_change_percent=industrial,
        rainfall=rainfall,
        wind_speed_change=wind,
        temperature_change=temp,
    )
    base_cat = aqi_category(base_aqi) if base_aqi is not None else "Unknown"
    return jsonify({
        "base_aqi": base_aqi,
        "base_category": base_cat,
        "simulated_aqi": result["simulated_aqi"],
        "simulated_category": result["simulated_category"],
        "simulated_pollutants": result["simulated_pollutants"],
        "health_advisory_original": _advisory(base_cat),
        "health_advisory_simulated": _advisory(result["simulated_category"]),
        "disclaimer": "Scenario-Based Prediction (Educational). Not official atmospheric modeling.",
    })


def _advisory(category):
    adv = {
        "Good": "Air quality is satisfactory. Enjoy outdoor activities.",
        "Moderate": "Air quality is acceptable. Unusually sensitive people should consider limiting prolonged outdoor exertion.",
        "Unhealthy for Sensitive Groups": "Members of sensitive groups may experience health effects. Consider reducing prolonged outdoor exertion.",
        "Unhealthy": "Everyone may begin to experience health effects. Consider staying indoors and reducing outdoor activities.",
        "Very Unhealthy": "Health alert: everyone may experience serious health effects. Limit outdoor exposure.",
        "Hazardous": "Health emergency: everyone may experience serious health effects. Stay indoors and avoid outdoor exposure.",
    }
    return adv.get(category, "Insufficient data for health advisory.")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    app.run(host="0.0.0.0", port=port, debug=True)
