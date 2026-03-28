const express = require('express');
const { upload } = require('../utils/upload');
const { swapFace } = require('../controllers/faceSwapController');

const router = express.Router();

router.post(
  '/swap-face',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'portrait', maxCount: 1 }
  ]),
  swapFace
);

module.exports = router;
