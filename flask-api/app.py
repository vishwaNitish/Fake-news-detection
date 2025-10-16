from flask import Flask, request, jsonify
import pickle

app = Flask(__name__)

# Load pre-trained model (you can replace this with your actual model later)
try:
    with open("model.pkl", "rb") as f:
        model = pickle.load(f)
except:
    model = None  # in case no model exists yet

@app.route("/")
def home():
    return jsonify({"message": "Flask ML API is running!"})

@app.route("/predict", methods=["POST"])
def predict():
    data = request.get_json()
    text = data.get("text", "")

    # Temporary fake logic (replace later with ML prediction)
    prediction = "FAKE" if "fake" in text.lower() else "REAL"

    return jsonify({
        "input_text": text,
        "prediction": prediction
    })

if __name__ == "__main__":
    app.run(debug=True, port=5000)
