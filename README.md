# AudioTrackDown — YouTube & Facebook Audio Extractor & Subtitle Downloader

AudioTrackDown is a high-performance SaaS platform that extracts original audio tracks, dubbed voiceovers, and subtitles/captions (in 157+ languages) from any YouTube or Facebook URL.

## Directory Structure

This project is structured as a monorepo containing the frontend and backend in separate directories:

*   **`frontend/`**: Next.js 15 app built with React 19, Tailwind CSS, Lucide React, and SWR.
*   **`backend/`**: Node.js Express server running ffmpeg, python3, and `yt-dlp` to download, convert, and proxy stream piping.

---

## Local Development

### 1. Backend Setup
1. Navigate to the backend directory:
    ```bash
    cd backend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Configure environment variables in a `.env` file (see `.env.example`).
4. Start the development server:
    ```bash
    npm run dev
    ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
    ```bash
    cd ../frontend
    ```
2. Install dependencies:
    ```bash
    npm install
    ```
3. Configure environment variables in `.env.local` (see `.env.example`).
4. Run the development server:
    ```bash
    npm run dev
    ```

---

## Deployment Guide

### Frontend: Deploy to Vercel

The frontend is a standard Next.js application that can be deployed to Vercel with minimal configuration:

1. **Connect GitHub**: Import this repository into Vercel.
2. **Root Directory**: Under *Build & Development Settings*, set the **Root Directory** to `frontend`.
3. **Environment Variables**: Add your frontend environment variables (like `POSTGRES_URL`, `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN`, `BACKEND_URL`, etc.).
4. **Deploy**: Click deploy. Vercel will automatically detect Next.js and build it.

### Backend: Deploy to Railway

The backend includes a `Dockerfile` pre-configured to install system dependencies (ffmpeg, python3, curl) and the latest `yt-dlp` binary needed for audio extraction.

1. **Connect GitHub**: Connect this repository to a new project in Railway.
2. **Root Directory / Build Settings**: In the service settings under *Builder*, specify the root directory as `backend/` or ensure Railway uses the `backend/Dockerfile` to build.
3. **Environment Variables**: Add the backend environment variables in Railway: `GEMINI_API_KEY`, `BACKEND_SECRET`, `DATABASE_PATH`, `NODE_ENV`, `PORT`, and `FRONTEND_URL`.
4. **Volume**: Mount a persistent volume at `/data` and set `DATABASE_PATH=/data/database.db` to persist SQLite data across deploys.
5. **Expose Port**: Railway automatically exposes the port defined in the Dockerfile (`4000`).

---

## Features
- **Original & Dubbed Audio Extraction**: Download audio files in MP3, M4A, and WebM format.
- **Subtitle & Captions Exporter**: Extract auto-generated or manual subtitles in SRT, VTT, and JSON.
- **Unified Clean Branding**: Fully styled in indigo-accented branding with staggering page load transitions and modern typography.
