const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const { spawn } = require("child_process");
const path = require("path");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/fake-news-detection";

mongoose
  .connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error(" MongoDB connection error:", err));

// MongoDB Schema for storing analysis history
const analysisSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
  },
  prediction: {
    type: String,
    enum: ["Real", "Fake"],
    required: true,
  },
  confidence: {
    type: Number,
    required: true,
  },
  isFake: {
    type: Boolean,
    required: true,
  },
  textLength: {
    type: Number,
    required: true,
  },
  analyzedAt: {
    type: Date,
    default: Date.now,
  },
  ipAddress: String,
  userAgent: String,
});

const Analysis = mongoose.model("Analysis", analysisSchema);

// Helper function to call Python ML model
function callPythonPredict(text) {
  return new Promise((resolve, reject) => {
    const pythonPath = process.env.PYTHON_PATH || "python";
    const scriptPath = path.join(__dirname, "../ml-service/ml_model.py");

    const pythonProcess = spawn(pythonPath, [scriptPath, "predict", text]);

    let dataString = "";
    let errorString = "";

    pythonProcess.stdout.on("data", (data) => {
      dataString += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorString += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0) {
        reject(
          new Error(`Python process exited with code ${code}: ${errorString}`),
        );
        return;
      }

      try {
        const result = JSON.parse(dataString.trim());
        resolve(result);
      } catch (error) {
        reject(new Error(`Failed to parse Python output: ${error.message}`));
      }
    });
  });
}

// Routes

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "Fake News Detection API - MERN Stack",
    status: "running",
    endpoints: {
      "POST /api/news/analyze": "Analyze news article",
      "GET /api/history": "Get analysis history",
      "GET /api/stats": "Get statistics",
      "DELETE /api/history/:id": "Delete analysis record",
      "DELETE /api/history": "Clear all history",
    },
  });
});

// Analyze news article
app.post("/api/news/analyze", async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Text is required",
      });
    }

    // Call Python ML model
    const mlResult = await callPythonPredict(text);

    if (mlResult.error) {
      return res.status(500).json({
        success: false,
        error: mlResult.error,
      });
    }

    // Save to MongoDB
    const analysis = new Analysis({
      text: text.substring(0, 1000), // Store first 1000 chars
      prediction: mlResult.prediction,
      confidence: mlResult.confidence,
      isFake: mlResult.is_fake,
      textLength: text.length,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });

    await analysis.save();

    res.json({
      success: true,
      data: {
        id: analysis._id,
        prediction: mlResult.prediction,
        confidence: mlResult.confidence,
        isFake: mlResult.is_fake,
        textLength: text.length,
        analyzedAt: analysis.analyzedAt,
      },
    });
  } catch (error) {
    console.error("Analysis error:", error);
    res.status(500).json({
      success: false,
      error:
        error.message ||
        "Failed to analyze text. Make sure the ML model is trained.",
    });
  }
});

// Get analysis history
app.get("/api/history", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const history = await Analysis.find()
      .sort({ analyzedAt: -1 })
      .limit(limit)
      .skip(skip)
      .select("-ipAddress -userAgent");

    const total = await Analysis.countDocuments();

    res.json({
      success: true,
      data: {
        history,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Get statistics
app.get("/api/stats", async (req, res) => {
  try {
    const totalAnalyses = await Analysis.countDocuments();
    const fakeCount = await Analysis.countDocuments({ isFake: true });
    const realCount = await Analysis.countDocuments({ isFake: false });

    // Get recent analyses (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentCount = await Analysis.countDocuments({
      analyzedAt: { $gte: oneDayAgo },
    });

    res.json({
      success: true,
      data: {
        total: totalAnalyses,
        fake: fakeCount,
        real: realCount,
        fakePercentage:
          totalAnalyses > 0
            ? ((fakeCount / totalAnalyses) * 100).toFixed(2)
            : 0,
        realPercentage:
          totalAnalyses > 0
            ? ((realCount / totalAnalyses) * 100).toFixed(2)
            : 0,
        last24Hours: recentCount,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Delete specific analysis
app.delete("/api/history/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Analysis.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: "Analysis not found",
      });
    }

    res.json({
      success: true,
      message: "Analysis deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Clear all history
app.delete("/api/history", async (req, res) => {
  try {
    const result = await Analysis.deleteMany({});

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} analyses`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    status: "healthy",
    mongodb:
      mongoose.connection.readyState === 1 ? "connected" : "disconnected",
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Something went wrong!",
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║    Fake News Detection API Server           ║
║    Server running on port ${PORT}             ║
║    MongoDB: ${MONGODB_URI.substring(0, 30)}...   ║
╚════════════════════════════════════════════════╝
  
📍 Endpoints:
   POST   /api/news/analyze  - Analyze news
   GET    /api/history       - Get history
   GET    /api/stats         - Get statistics
   DELETE /api/history/:id   - Delete analysis
   DELETE /api/history       - Clear all history
   GET    /api/health        - Health check
  `);
});
