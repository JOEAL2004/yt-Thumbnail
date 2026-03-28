# Gemini AI Face Swap Web App

A complete full-stack web application for AI-powered face swapping using **Node.js + Express** on the backend and **HTML/CSS/Vanilla JS** on the frontend.

## Features

- Upload target thumbnail image
- Upload source portrait face image
- Optional instruction prompt for prompt tuning
- Gemini 3 Pro Image Preview integration
- Preview uploaded files before submit
- Drag & drop uploads
- Loading/progress UI during generation
- Display and download final face-swapped result
- Backend validation (file type + size limit)
- Temporary file cleanup after processing

## Project Structure

```text
.
├── public
│   ├── index.html
│   ├── script.js
│   └── style.css
├── server
│   ├── controllers
│   │   └── faceSwapController.js
│   ├── routes
│   │   └── faceSwapRoutes.js
│   ├── utils
│   │   └── upload.js
│   └── index.js
├── uploads
│   └── .gitkeep
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Setup Instructions

1. Install dependencies:

```bash
npm install
```

2. Create environment variables file:

```bash
cp .env.example .env
```

3. Open `.env` and set your Gemini API key:

```env
GEMINI_API_KEY=your_real_api_key
PORT=3000
```

4. Start the app:

```bash
npm run dev
```

Or production mode:

```bash
npm start
```

5. Open in browser:

```text
http://localhost:3000
```

## API

### `POST /api/swap-face`

`multipart/form-data` fields:

- `thumbnail` (required image file)
- `portrait` (required image file)
- `instructions` (optional text)

Successful response:

```json
{
  "imageBase64": "...",
  "mimeType": "image/png"
}
```

## Gemini Prompt Used

The backend constructs this instruction:

> Swap the face from the portrait image onto the person in the thumbnail image. Ensure realism, correct lighting, skin tone matching, and seamless blending. {extra_user_instructions}

Then adds extra alignment tuning:

- preserve scene/background from thumbnail
- transfer face identity from portrait
- prioritize clean alignment, natural expression retention, realistic color transfer, and high-fidelity details

## Notes

- Uploaded files are temporarily stored in `/uploads` and deleted after processing.
- Only image MIME types (`jpeg`, `png`, `webp`) are accepted.
- Max upload size is 10MB per file.
- This app uses the model: `gemini-3-pro-image-preview`.

## Production Hardening Suggestions

- Add rate limiting and request authentication.
- Add CSRF protection for forms.
- Add retry and circuit-breaker logic for model errors.
- Store generated output in object storage (e.g., GCS/S3) if persistence is needed.
