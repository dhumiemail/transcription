const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const port = 4000;

// Multer setup for file uploads
const upload = multer({ dest: 'uploads/' });

// Transcribe endpoint
app.post('/transcribe', upload.single('audio'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  console.log("trancribing");
  const whisperCliPath = path.resolve(__dirname, 'whisper.cpp/build/bin/whisper-cli');
  const modelPath = path.resolve(__dirname, 'models/ggml-tiny.en.bin');
  const audioFilePath = path.resolve(__dirname, req.file.path);

  const whisperProcess = spawn(whisperCliPath, ['-m', modelPath, '-f', audioFilePath]);

  let transcription = '';

  whisperProcess.stdout.on('data', (data) => {
    transcription += data.toString();
  });

  whisperProcess.on('close', (code) => {
    fs.unlink(audioFilePath, (err) => {
      if (err) {
        console.error('Failed to delete file:', err);
      }
    });

    if (code === 0) {
      const cleanedTranscription = transcription.replace(/\[.*?\]/g, '').replace(/\n/g, ' ').trim();
      res.json({ transcription: cleanedTranscription });
    } else {
      res.status(500).json({ error: 'Transcription failed' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});