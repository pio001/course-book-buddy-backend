# UniBookshop Backend API

## Quick Start
1. Copy `.env.example` to `.env` and fill values.
2. Install dependencies:
   - `npm install`
3. Run dev:
   - `npm run dev`

## Environment Variables
- `PORT` (default `5000`)
- `MONGODB_URI` (required)
- `JWT_SECRET` (required)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (required for uploads)
- `CLOUDINARY_UPLOAD_FOLDER` (optional, default `unibookshop`)