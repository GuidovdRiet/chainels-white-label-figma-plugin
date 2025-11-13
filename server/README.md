# Favicon Generation Server

This server provides an API endpoint to generate favicons from uploaded images using the RealFaviconGenerator packages.

## Setup

1. Install dependencies (already done):

```bash
npm install
```

2. Start the server:

```bash
npm run server
```

The server will run on `http://localhost:3001`

## API Endpoint

### POST `/api/generate-favicons`

Upload an image file to generate favicons.

**Request:**

- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `image`: Image file (required)
  - `siteName`: Site name for manifest (optional, defaults to "Site")

**Response:**

```json
{
  "success": true,
  "files": {
    "favicon.ico": {
      "content": "base64-encoded-content",
      "mimeType": "image/x-icon",
      "encoding": "base64"
    },
    "favicon-16x16.png": {
      "content": "base64-encoded-content",
      "mimeType": "image/png",
      "encoding": "base64"
    },
    // ... more files
    "site.webmanifest": {
      "content": "{...}",
      "mimeType": "application/manifest+json"
    }
  },
  "html": "<link rel=\"icon\"...>"
}
```

## Usage

The Figma plugin UI will automatically call this server when you upload a favicon image. Make sure the server is running before using the favicon generation feature.

## Health Check

GET `/health` - Returns `{ "status": "ok" }`
