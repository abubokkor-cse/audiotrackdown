# AudioTrackDown 🎵

<p align="center">
  <img src="./audiotrackdown.png" alt="AudioTrackDown UI Preview" width="100%" style="border-radius: 16px; box-shadow: 0 10px 30px rgba(0,0,0,0.1);" />
</p>

<p align="center">
  <strong>Fast, high-performance web platform to extract original audio, multi-language dubbed voice tracks, and subtitles (157+ languages) from YouTube and Facebook videos — 100% Ad-Free.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/Node.js-18+-green?style=flat-square&logo=node.js" alt="Node.js" />
  <img src="https://img.shields.io/badge/Python-3.10+-yellow?style=flat-square&logo=python" alt="Python" />
  <img src="https://img.shields.io/badge/yt--dlp-Latest-red?style=flat-square" alt="yt-dlp" />
  <img src="https://img.shields.io/badge/FFmpeg-Supported-purple?style=flat-square&logo=ffmpeg" alt="FFmpeg" />
  <img src="https://img.shields.io/badge/Ads-Zero%20(100%25%20Ad--Free)-emerald?style=flat-square" alt="100% Ad-Free" />
</p>

---

## ✨ Features

- **Multi-Track Audio Extraction**: Extract and download original and dubbed multi-language audio streams from YouTube and Facebook.
- **Multiple Formats**: Download in High Quality **M4A**, Compact **WebM**, or 320kbps **MP3**.
- **157+ Subtitle Languages**: Export auto-generated captions or official creator subtitles in **SRT**, **VTT**, or **JSON** format.
- **100% Ad-Free Experience**: Completely free of intrusive display ads, popups, redirects, and countdown delays. Downloads start instantly.
- **Live Search & Filter**: Real-time filtering across all available subtitle tracks.
- **Audio / Subtitle Tab Switcher**: Easily toggle between audio tracks and subtitle lists with exact count badges.
- **Mobile-First & Modern UI**: Built with Tailwind CSS, Lucide icons, glassmorphism cards, and smooth micro-animations.

---

## 📋 What to Install (Prerequisites)

Before running AudioTrackDown, make sure you have the following installed on your machine:

| Tool | Recommended Version | Purpose |
| :--- | :--- | :--- |
| **Node.js** | `v18.x` or `v20.x+` | JavaScript runtime for both frontend and backend |
| **pnpm** | `v9.x+` | Fast package manager for frontend dependencies |
| **Python** | `3.10+` | Required by `yt-dlp` |
| **FFmpeg** | `v5.x+` or `v6.x+` | Audio transcoding (MP3 conversion) and stream slicing |
| **yt-dlp** | Latest | Core video & audio metadata extraction engine |

### System Dependency Installation

#### 🍏 macOS (using Homebrew)
```bash
# Install Node.js, pnpm, Python 3, FFmpeg, and yt-dlp
brew install node pnpm python ffmpeg yt-dlp
```

#### 🐧 Ubuntu / Debian
```bash
sudo apt update
sudo apt install -y nodejs npm python3 python3-pip ffmpeg
sudo npm install -g pnpm

# Install latest yt-dlp binary
sudo wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp
sudo chmod a+rx /usr/local/bin/yt-dlp
```

#### 🪟 Windows (using winget or Chocolatey)
```powershell
winget install OpenJS.NodeJS.LTS
winget install pnpm.pnpm
winget install Python.Python.3.11
winget install Gyan.FFmpeg
winget install yt-dlp.yt-dlp
```

---

## 🚀 How to Run (Simple Step-by-Step)

The project is structured as a monorepo with `backend/` and `frontend/`.

### 1. Clone the Repository
```bash
git clone https://github.com/abubokkor-cse/audiotrackdown.git
cd audiotrackdown
```

---

### 2. Start the Backend Server

The backend handles video stream extraction, yt-dlp execution, and MP3 transcoding.

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies
npm install

# 3. Create your .env file
cp .env.example .env

# 4. Start the backend in development mode
npm run dev
```

> **Backend will run on:** `http://localhost:4001` (or the port defined in `.env`).

---

### 3. Start the Frontend Application

The frontend is a modern Next.js 15 application.

```bash
# 1. In a new terminal window, navigate to the frontend directory
cd frontend

# 2. Install dependencies with pnpm
pnpm install

# 3. Create your local environment configuration
cp .env.example .env.local

# 4. Start the frontend development server
pnpm dev
```

> **Frontend will run on:** `http://localhost:3000` (or `http://localhost:3001` if port 3000 is occupied).

Open **`http://localhost:3000`** in your browser to start using AudioTrackDown!

---

## ⚙️ Environment Variables Reference

### Backend (`backend/.env`)

```env
PORT=4001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=50
YTDLP_TIMEOUT_MS=30000
BACKEND_SECRET=your-shared-secret
```

### Frontend (`frontend/.env.local`)

```env
# Base URL of frontend
BASE_URL=http://localhost:3000

# Backend API connection
BACKEND_URL=http://localhost:4001
NEXT_PUBLIC_API_URL=http://localhost:4001
BACKEND_SECRET=your-shared-secret

# Database (optional for basic extraction, required for user accounts/history)
POSTGRES_URL=postgresql://user:password@localhost:5432/audiotrackdown
AUTH_SECRET=your-auth-secret-here

# Optional: Paddle Billing for Pro subscriptions
NEXT_PUBLIC_PADDLE_CLIENT_TOKEN=test_xxx
NEXT_PUBLIC_PADDLE_ENV=sandbox
NEXT_PUBLIC_PADDLE_PRICE_MONTHLY=pri_xxx
NEXT_PUBLIC_PADDLE_PRICE_ANNUAL=pri_xxx
PADDLE_API_KEY=pdl_snd_xxx
PADDLE_NOTIFICATION_WEBHOOK_SECRET=ntfwhs_xxx
```

---

## 📂 Project Architecture

```
audiotrackdown/
├── audiotrackdown.png         # Screenshot & visual preview
├── backend/                  # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/      # Extract, download, and subtitle controllers
│   │   ├── middleware/       # Security headers, rate limiting, auth
│   │   ├── services/         # yt-dlp runner, transcode queue, stream proxy
│   │   └── server.js         # Express app initialization
│   ├── Dockerfile            # Production container configuration
│   ├── package.json
│   └── .env.example
└── frontend/                 # Next.js 15 (Turbopack) + React 19 + Tailwind
    ├── app/
    │   ├── (dashboard)/
    │   │   ├── page.tsx      # Main audio extraction & subtitle downloader
    │   │   ├── youtube-subtitle-downloader/ # Dedicated subtitle SEO tool page
    │   │   ├── pricing/      # Pricing & plans
    │   │   └── dashboard/    # User settings and download history
    │   ├── api/              # Next.js API proxy routes
    │   └── layout.tsx        # Root layout, metadata & fonts
    ├── components/           # UI components, badges, modals
    ├── package.json
    └── pnpm-lock.yaml
```

---

## 🚢 Production Deployment

### Backend: Railway (Recommended)

1. Connect the GitHub repository to [Railway](https://railway.app).
2. Set the **Root Directory** to `backend/`.
3. Railway automatically detects the `backend/Dockerfile` which installs `python3`, `ffmpeg`, and `yt-dlp`.
4. Configure backend environment variables in Railway settings (`PORT=4000`, `NODE_ENV=production`, `FRONTEND_URL=https://your-frontend.vercel.app`, `BACKEND_SECRET`).

### Frontend: Vercel (Recommended)

1. Import the repository in [Vercel](https://vercel.com).
2. Set **Root Directory** to `frontend`.
3. Add environment variables (`BACKEND_URL=https://your-backend.railway.app`, `NEXT_PUBLIC_API_URL=https://your-backend.railway.app`, `POSTGRES_URL`, `AUTH_SECRET`, etc.).
4. Deploy with automatic Next.js optimization.

---

## 📄 License

MIT © [Md. Abu Bokkor](https://github.com/abubokkor-cse)
