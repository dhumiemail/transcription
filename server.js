require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { whisper } = require("whisper-node");
const cors = require("cors");

const app = express();
const port = process.env.PORT || 4000;
const modelPath =
  process.env.MODEL_PATH || "/app/whisper.cpp/models/ggml-tiny.bin";
app.use(cors());
// Setup upload folder
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

// Setup transcripts folder
const transcriptDir = path.join(__dirname, "transcripts");
if (!fs.existsSync(transcriptDir)) fs.mkdirSync(transcriptDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

// Endpoint to get audio file and respond with transcript text file
app.post("/transcribe", upload.single("audio"), async (req, res) => {
  const filePath = req.file?.path;

  try {
    if (!req.file) return res.status(400).send("No file uploaded.");

    console.log("Using model path:", modelPath);

    const transcript = await whisper(filePath, {
      modelPath: modelPath,
      whisperOptions: {
        language: "en",
      },
    });

    if (!transcript || !Array.isArray(transcript)) {
      throw new Error("Transcription failed - invalid response");
    }

    const transcriptStr = transcript.map((item) => item.speech).join(" ");

    // Send response first
    res.json({ transcription: transcriptStr });

    // Then delete the file
    try {
      await fs.promises.unlink(filePath);
      console.log(`Successfully deleted: ${filePath}`);
    } catch (deleteError) {
      console.error(`Failed to delete audio file ${filePath}:`, deleteError);
    }
  } catch (error) {
    // If there's an error, try to clean up the file before sending error response
    if (filePath) {
      try {
        await fs.promises.unlink(filePath);
        console.log(`Cleaned up file after error: ${filePath}`);
      } catch (deleteError) {
        console.error("Failed to delete file after error:", deleteError);
      }
    }

    console.error("Transcription error:", error);
    res.status(500).json({ error: error.message || "Transcription failed." });
  }
});

app.listen(port, () => {
  console.log(`The server is running at:${port}`);
});
