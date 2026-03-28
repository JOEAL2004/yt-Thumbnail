require('dotenv').config();

const express = require('express');
const path = require('path');
const multer = require('multer');
const faceSwapRouter = require('./routes/faceSwapRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/api', faceSwapRouter);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File is too large. Maximum allowed size is 10MB per file.' });
    }

    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err?.message?.includes('Invalid file type')) {
    return res.status(400).json({ error: err.message });
  }

  console.error('Unhandled server error:', err);
  return res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
