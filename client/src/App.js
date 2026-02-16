import { useState, useEffect } from "react";
import axios from "axios";

const API_URL = "http://localhost:5000/api";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState("analyze"); // analyze, history, stats

  // Fetch stats on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_URL}/stats`);
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/history?limit=20`);
      if (res.data.success) {
        setHistory(res.data.data.history);
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  };

  const analyzeNews = async () => {
    if (!text.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setResult(null);

      const res = await axios.post(`${API_URL}/news/analyze`, { text });

      if (res.data.success) {
        setResult(res.data.data);
        fetchStats(); // Update stats after analysis
      }
    } catch (error) {
      console.error("Error:", error);
      setError(
        error.response?.data?.error ||
          "Error analyzing news. Make sure the backend server is running and the ML model is trained.",
      );
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    setText("");
    setResult(null);
    setError("");
  };

  const loadExample = (exampleText) => {
    setText(exampleText);
    setResult(null);
    setError("");
  };

  const deleteHistory = async (id) => {
    try {
      await axios.delete(`${API_URL}/history/${id}`);
      fetchHistory();
      fetchStats();
    } catch (error) {
      console.error("Failed to delete history:", error);
    }
  };

  const clearAllHistory = async () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      try {
        await axios.delete(`${API_URL}/history`);
        setHistory([]);
        fetchStats();
      } catch (error) {
        console.error("Failed to clear history:", error);
      }
    }
  };

  // Switch tab and fetch data
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "history") {
      fetchHistory();
    } else if (tab === "stats") {
      fetchStats();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <h1 className="text-5xl font-bold text-white mb-2">
            📰 Fake News Detector
          </h1>
          <p className="text-gray-300">
            MERN Stack + Python ML - Analyze news articles for authenticity
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => switchTab("analyze")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === "analyze"
                ? "bg-white text-purple-900"
                : "bg-purple-800 text-white hover:bg-purple-700"
            }`}
          >
            🔍 Analyze
          </button>
          <button
            onClick={() => switchTab("history")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === "history"
                ? "bg-white text-purple-900"
                : "bg-purple-800 text-white hover:bg-purple-700"
            }`}
          >
            📜 History
          </button>
          <button
            onClick={() => switchTab("stats")}
            className={`flex-1 py-3 px-6 rounded-lg font-semibold transition ${
              activeTab === "stats"
                ? "bg-white text-purple-900"
                : "bg-purple-800 text-white hover:bg-purple-700"
            }`}
          >
            📊 Statistics
          </button>
        </div>

        {/* Analyze Tab */}
        {activeTab === "analyze" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter News Article or Headline
              </label>
              <textarea
                rows="6"
                placeholder="Paste news article, headline, or any text here..."
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  setError("");
                }}
                className="w-full p-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-gray-700"
              />
              <div className="text-right text-sm text-gray-500 mt-1">
                {text.length} characters
              </div>
            </div>

            <div className="flex gap-3 mb-6">
              <button
                onClick={analyzeNews}
                disabled={!text || loading}
                className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Analyzing...
                  </span>
                ) : (
                  "🔍 Analyze News"
                )}
              </button>

              <button
                onClick={clearAll}
                className="bg-gray-200 text-gray-700 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition"
              >
                Clear
              </button>
            </div>

            {/* Example Buttons */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-2">Try an example:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    loadExample(
                      "Scientists at MIT have developed a new renewable energy technology that could revolutionize solar power efficiency by 40%.",
                    )
                  }
                  className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded-lg hover:bg-blue-200 transition"
                >
                  Real News Example
                </button>
                <button
                  onClick={() =>
                    loadExample(
                      "BREAKING: Government to give everyone free cars next week! Share before they delete this!",
                    )
                  }
                  className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded-lg hover:bg-red-200 transition"
                >
                  Fake News Example
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-lg">
                <p className="font-semibold">⚠️ Error</p>
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Result Display */}
            {result && (
              <div
                className={`p-6 rounded-xl border-2 ${
                  result.prediction === "Fake"
                    ? "bg-red-50 border-red-300"
                    : "bg-green-50 border-green-300"
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">
                      Analysis Result
                    </h3>
                  </div>
                  <div
                    className={`text-4xl ${
                      result.prediction === "Fake"
                        ? "text-red-600"
                        : "text-green-600"
                    }`}
                  >
                    {result.prediction === "Fake" ? "❌" : "✅"}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">
                      Prediction:
                    </span>
                    <span
                      className={`text-2xl font-bold ${
                        result.prediction === "Fake"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {result.prediction}
                    </span>
                  </div>

                  {result.confidence && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">
                        Confidence:
                      </span>
                      <span className="text-lg font-semibold text-gray-800">
                        {(result.confidence * 10).toFixed(1)}%
                      </span>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t border-gray-300">
                    <p className="text-sm text-gray-600">
                      {result.prediction === "Fake" ? (
                        <>
                          <strong>⚠️ Warning:</strong> This text shows
                          characteristics commonly associated with fake or
                          misleading news. Always verify information from
                          trusted sources.
                        </>
                      ) : (
                        <>
                          <strong>✓ Note:</strong> This text appears to be
                          authentic, but always cross-reference important
                          information with multiple reliable sources.
                        </>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Summary */}
            {stats && (
              <div className="mt-6 grid grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.total}
                  </div>
                  <div className="text-sm text-gray-600">Total Analyzed</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.real}
                  </div>
                  <div className="text-sm text-gray-600">Real News</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {stats.fake}
                  </div>
                  <div className="text-sm text-gray-600">Fake News</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Analysis History
              </h2>
              {history.length > 0 && (
                <button
                  onClick={clearAllHistory}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                >
                  Clear All
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl">No analysis history yet</p>
                <p className="text-sm mt-2">
                  Analyze some news to see history here
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div
                    key={item._id}
                    className={`p-4 rounded-lg border-2 ${
                      item.isFake
                        ? "bg-red-50 border-red-200"
                        : "bg-green-50 border-green-200"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              item.isFake
                                ? "bg-red-200 text-red-800"
                                : "bg-green-200 text-green-800"
                            }`}
                          >
                            {item.prediction}
                          </span>
                          <span className="text-sm text-gray-500">
                            {new Date(item.analyzedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-gray-700 text-sm line-clamp-2">
                          {item.text}
                        </p>
                        <div className="mt-2 text-xs text-gray-500">
                          Confidence: {(item.confidence * 10).toFixed(1)}% |
                          Length: {item.textLength} chars
                        </div>
                      </div>
                      <button
                        onClick={() => deleteHistory(item._id)}
                        className="ml-4 text-red-500 hover:text-red-700"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {activeTab === "stats" && (
          <div className="bg-white rounded-2xl shadow-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Statistics Dashboard
            </h2>

            {stats ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-6 rounded-xl text-center">
                    <div className="text-4xl font-bold text-blue-600">
                      {stats.total}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Total Analyses
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-xl text-center">
                    <div className="text-4xl font-bold text-green-600">
                      {stats.real}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Real News</div>
                  </div>
                  <div className="bg-red-50 p-6 rounded-xl text-center">
                    <div className="text-4xl font-bold text-red-600">
                      {stats.fake}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Fake News</div>
                  </div>
                  <div className="bg-purple-50 p-6 rounded-xl text-center">
                    <div className="text-4xl font-bold text-purple-600">
                      {stats.last24Hours}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">Last 24h</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-green-100 to-green-50 p-6 rounded-xl">
                    <div className="text-lg font-semibold text-gray-700 mb-2">
                      Real News
                    </div>
                    <div className="text-3xl font-bold text-green-600">
                      {stats.realPercentage}%
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${stats.realPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-red-100 to-red-50 p-6 rounded-xl">
                    <div className="text-lg font-semibold text-gray-700 mb-2">
                      Fake News
                    </div>
                    <div className="text-3xl font-bold text-red-600">
                      {stats.fakePercentage}%
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full"
                        style={{ width: `${stats.fakePercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                Loading statistics...
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-white text-sm opacity-75">
          <p>💡 MERN Stack (MongoDB + Express + React + Node.js) + Python ML</p>
          <p className="mt-1">
            This tool uses machine learning to detect potential fake news
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
