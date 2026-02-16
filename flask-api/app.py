import pickle
import json
import pandas as pd
import re
import sys
import os
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

MODEL_PATH = os.path.join(BASE_DIR, "fake_news_model.pkl")
VECTORIZER_PATH = os.path.join(BASE_DIR, "tfidf_vectorizer.pkl")

class FakeNewsDetector:
    def __init__(self):
        self.model = None
        self.vectorizer = None

  
    # Text Cleaning
 
    def clean_text(self, text):
        text = text.lower()
        text = re.sub(r"http\S+", "", text)
        text = re.sub(r"[^a-zA-Z\s]", "", text)
        text = re.sub(r"\s+", " ", text).strip()
        return text


    # Training Function
 
    def train_model(self):

        # Load Kaggle dataset from the local directory  
        fake_df = pd.read_csv("Fake.csv")
        true_df = pd.read_csv("True.csv")

        fake_df["label"] = 1
        true_df["label"] = 0

        # Combine title + text 
        fake_df["text"] = fake_df["title"] + " " + fake_df["text"]
        true_df["text"] = true_df["title"] + " " + true_df["text"]

        df = pd.concat([fake_df, true_df], ignore_index=True)

        df = df[["text", "label"]]
        df.dropna(inplace=True)

        df["text"] = df["text"].apply(self.clean_text)

        # Train-test split
        X_train, X_test, y_train, y_test = train_test_split(
            df["text"], df["label"], test_size=0.2, random_state=42
        )

        # TF-IDF Vectorizer
        self.vectorizer = TfidfVectorizer(
            max_features=10000,
            stop_words="english",
            ngram_range=(1, 2),
            min_df=2,
            max_df=0.9
        )

        X_train_tfidf = self.vectorizer.fit_transform(X_train)
        X_test_tfidf = self.vectorizer.transform(X_test)

        # Logistic Regression (better probability output)
        self.model = LogisticRegression(max_iter=1000)
        self.model.fit(X_train_tfidf, y_train)

        # Evaluate
        y_pred = self.model.predict(X_test_tfidf)
        accuracy = accuracy_score(y_test, y_pred)

        print(f"Accuracy: {accuracy * 100:.2f}%")
        print(classification_report(y_test, y_pred))

        # Save model
        with open(MODEL_PATH, "wb") as f:
            pickle.dump(self.model, f)

        with open(VECTORIZER_PATH, "wb") as f:
            pickle.dump(self.vectorizer, f)

        print("Model saved successfully.")

    
    # Load Model
 
    def load_model(self):
        try:
            with open(MODEL_PATH, "rb") as f:
                self.model = pickle.load(f)

            with open(VECTORIZER_PATH, "rb") as f:
                self.vectorizer = pickle.load(f)

            return True
        except:
            return False

    
    # Prediction
  
    def predict(self, text):

        if self.model is None or self.vectorizer is None:
            if not self.load_model():
                return {"error": "Model not trained yet"}

        cleaned = self.clean_text(text)
        vectorized = self.vectorizer.transform([cleaned])

        prediction = self.model.predict(vectorized)[0]
        probabilities = self.model.predict_proba(vectorized)[0]

        confidence = float(max(probabilities)) * 100

        result = "Fake" if prediction == 1 else "Real"

        return {
            "prediction": result,
            "confidence": round(confidence, 2),
            "is_fake": bool(prediction == 1)
        }



# CLI Interface (Node Compatible)

if __name__ == "__main__":
    detector = FakeNewsDetector()

    try:
        if len(sys.argv) > 1:
            command = sys.argv[1]

            if command == "train":
                detector.train_model()

            elif command == "predict":
                text = sys.argv[2] if len(sys.argv) > 2 else ""
                result = detector.predict(text)
                print(json.dumps(result), flush=True)

            else:
                print(json.dumps({"error": "Invalid command"}), flush=True)
        else:
            print(json.dumps({"error": "No command provided"}), flush=True)

    except Exception as e:
        print(json.dumps({"error": str(e)}), flush=True)
        sys.exit(1)
