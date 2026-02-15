# ====== Stage 1: Build ======
FROM node:24.13.1-alpine AS builder
# Set working directory
WORKDIR /usr
# Install dependencies
COPY package*.json ./
RUN npm install
# Copy source code
COPY . .
# Build TypeScript
RUN npm run build
# Copy templates folder into dist
COPY src/app/utility/templates dist/app/utility/templates

# ====== Stage 2: Production Image ======
FROM node:24.13.1-alpine
# Set working directory
WORKDIR /usr
# Copy only built files from builder stage
COPY --from=builder /usr/dist ./dist
COPY --from=builder /usr/package*.json ./
# Install only production dependencies
RUN npm install --only=production
# Expose the port
EXPOSE 5333
# Start the app with PM2 runtime
CMD ["node", "dist/server.js"]