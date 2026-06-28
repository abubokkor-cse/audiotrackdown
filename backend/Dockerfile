FROM node:20-slim

# Install system dependencies (ffmpeg for TTS/audio merge, python3 for yt-dlp, curl to download yt-dlp)
RUN apt-get update && apt-get install -y \
    ffmpeg \
    python3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Download and install the latest yt-dlp binary
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Set working directory
WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install only production dependencies
RUN npm install --only=production

# Copy backend source files
COPY . .

# Expose port (Render/Railway will map this automatically)
EXPOSE 4000

# Start Express server
CMD ["npm", "start"]
