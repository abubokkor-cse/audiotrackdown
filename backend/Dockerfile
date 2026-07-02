FROM node:20-slim

# Install system dependencies (build-essential for compiling native modules like better-sqlite3, ffmpeg, python3, curl)
RUN apt-get update && apt-get install -y \
    build-essential \
    ffmpeg \
    python3 \
    python3-pip \
    python3-venv \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install curl_cffi and pysocks to allow yt-dlp to impersonate browser TLS signatures and use SOCKS5h proxies with remote DNS resolution
RUN pip3 install --break-system-packages curl_cffi pysocks


# Download and install latest yt-dlp binary (same version as local dev environment)
RUN curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

# Install Deno as the JS challenges solver for yt-dlp to extract all formats and multi-language dubbed audios
COPY --from=denoland/deno:bin-latest /deno /usr/local/bin/deno


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
