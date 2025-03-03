FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the app's source code
COPY . .

# Expose the port the app runs on
EXPOSE 4000

# Install Whisper.cpp dependencies
RUN apk add --no-cache git build-base cmake ffmpeg curl

# Clone and build Whisper.cpp
RUN git clone https://github.com/ggerganov/whisper.cpp.git && \
    cd whisper.cpp && \
    mkdir -p build && cd build && \
    cmake .. && make

# Ensure the models directory exists
RUN mkdir -p models

# Download the tiny model
RUN curl -L -o models/ggml-tiny.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-tiny.en.bin

# Command to run the app
CMD ["node", "server.js"]
