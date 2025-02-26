FROM node:18

# Install build dependencies
RUN apt-get update && apt-get install -y \
    git \
    make \
    g++ \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Set up Node.js application
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Clone and build whisper.cpp in the app directory
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    cmake . && \
    make && \
    bash ./models/download-ggml-model.sh tiny

# Copy the rest of the application code
COPY . .

# Set environment variables for whisper.cpp paths

# Expose the application port
EXPOSE 4000

# Start the application
CMD ["node", "server.js"]
