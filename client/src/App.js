import { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);

  const analyzeNews = async () => {
    try {
      setLoading(true);
      const res = await axios.post("http://localhost:8080/api/news/analyze", {
        text,
      });
      setResult(res.data.prediction);
    } catch (error) {
      setResult("Error analyzing news");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="bg-white w-full max-w-xl p-8 rounded-2xl shadow-xl">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-6">
          📰 Fake News Detection
        </h1>

        <textarea
          rows="5"
          placeholder="Paste news article or headline here..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full p-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
        />

        <button
          onClick={analyzeNews}
          disabled={!text || loading}
          className="w-full mt-4 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? "Analyzing..." : "Analyze News"}
        </button>

        {result && (
          <div
            className={`mt-6 text-center text-xl font-semibold ${
              result === "Fake" ? "text-red-600" : "text-green-600"
            }`}
          >
            Prediction: {result}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
