import { useState } from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState("");
  const [result, setResult] = useState("");

  const analyzeNews = async () => {
    const res = await axios.post("http://localhost:8080/api/news/analyze", { text });
    setResult(res.data.prediction);
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>📰 Fake News Detection</h1>
      <textarea
        rows="5"
        cols="50"
        placeholder="Enter news text here..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <br />
      <button onClick={analyzeNews}>Analyze</button>
      <h2>Prediction: {result}</h2>
    </div>
  );
}

export default App;
