const fs = require('fs/promises');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const baseInstruction =
  'Swap the face from the portrait image onto the person in the thumbnail image. Ensure realism, correct lighting, skin tone matching, and seamless blending.';

const getMimeTypeFromExtension = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.png':
      return 'image/png';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
};

const imageFileToInlineData = async (file) => {
  const buffer = await fs.readFile(file.path);
  return {
    mimeType: file.mimetype || getMimeTypeFromExtension(file.path),
    data: buffer.toString('base64')
  };
};

const safeDeleteFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn(`Could not delete temporary file: ${filePath}`, error.message);
    }
  }
};

const extractImageFromResponse = (response) => {
  const candidates = response?.candidates || [];

  for (const candidate of candidates) {
    const parts = candidate?.content?.parts || [];
    for (const part of parts) {
      if (part?.inlineData?.data) {
        return {
          imageBase64: part.inlineData.data,
          mimeType: part.inlineData.mimeType || 'image/png'
        };
      }
    }
  }

  return null;
};

const swapFace = async (req, res) => {
  const thumbnailFile = req.files?.thumbnail?.[0];
  const portraitFile = req.files?.portrait?.[0];
  const userInstructions = (req.body.instructions || '').trim();

  if (!thumbnailFile || !portraitFile) {
    await Promise.all([
      safeDeleteFile(thumbnailFile?.path),
      safeDeleteFile(portraitFile?.path)
    ]);
    return res.status(400).json({ error: 'Both thumbnail and portrait images are required.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    await Promise.all([
      safeDeleteFile(thumbnailFile.path),
      safeDeleteFile(portraitFile.path)
    ]);
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const thumbnailInlineData = await imageFileToInlineData(thumbnailFile);
    const portraitInlineData = await imageFileToInlineData(portraitFile);

    const prompt = `${baseInstruction} ${userInstructions}`.trim();

    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text:
                'Image #1 is the target thumbnail image (keep scene/background). Image #2 is the source portrait face to transfer. Output a single edited image only.'
            },
            { inlineData: thumbnailInlineData },
            { inlineData: portraitInlineData },
            {
              text: `${prompt} Prioritize clean face alignment, natural expression retention, realistic color transfer, and high-fidelity details.`
            }
          ]
        }
      ],
      config: {
        responseModalities: ['IMAGE']
      }
    });

    const generatedImage = extractImageFromResponse(response);

    if (!generatedImage) {
      return res.status(502).json({ error: 'Model did not return a generated image.' });
    }

    return res.status(200).json({
      imageBase64: generatedImage.imageBase64,
      mimeType: generatedImage.mimeType
    });
  } catch (error) {
    console.error('Gemini API face swap error:', error);
    return res.status(502).json({
      error: 'Failed to generate face-swapped image. Please try again.'
    });
  } finally {
    await Promise.all([
      safeDeleteFile(thumbnailFile.path),
      safeDeleteFile(portraitFile.path)
    ]);
  }
};

module.exports = {
  swapFace
};
