FROM node:20-slim

# Install system dependencies (build-essential for compiling native modules like better-sqlite3, ffmpeg, python3, curl)
RUN apt-get update && apt-get install -y \
    build-essential \
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
RUN npm install --omit=dev

# Copy backend source files
COPY . .

# Railway injects PORT dynamically at runtime
EXPOSE ${PORT:-4000}

# Start Express server
CMD ["npm", "start"]
