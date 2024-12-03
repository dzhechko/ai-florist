# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Set npm configuration for faster installs
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Copy all config files first
COPY package*.json ./
COPY tsconfig*.json ./
COPY postcss.config.js ./
COPY tailwind.config.js ./
COPY vite.config.ts ./
COPY index.html ./

# Install dependencies
RUN npm install --prefer-offline --no-audit

# Copy source files
COPY src/ ./src/

# Build the application with proper environment
ENV NODE_ENV=production \
    VITE_API_URL=http://ai-buket.llmplay.ru:5000

RUN npm run build && \
    ls -la dist && \
    echo "Build completed successfully"

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set npm configuration for faster installs
RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-mintimeout 20000 \
    && npm config set fetch-retry-maxtimeout 120000

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --prefer-offline --no-audit --omit=dev

# Copy server and built files
COPY server.js ./
COPY --from=build /app/dist ./dist

# Verify the dist directory contents
RUN ls -la dist && \
    echo "Production files copied successfully"

# Create directory for logs if needed
RUN mkdir -p /app/logs

# Expose the port
EXPOSE 5000

# Set production environment
ENV NODE_ENV=production \
    PORT=5000

# Start the server
CMD ["node", "server.js"]

# Добавляем установку пакетов для логирования
RUN npm install winston winston-daily-rotate-file --prefer-offline --no-audit

# Создаем директорию для логов с правильными правами
RUN mkdir -p /app/logs && \
    chown -R node:node /app/logs 