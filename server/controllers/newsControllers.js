import axios from "axios";

export const analyzeNews = async (req, res) => {
  try {
    const { text } = req.body;

    const flaskResponse = await axios.post("http://127.0.0.1:5000/predict", { text });

    res.json({
      fromNode: "Connected to Flask Successfully ✅",
      ...flaskResponse.data
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Flask connection failed", details: err.message });
  }
};
