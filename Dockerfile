# ====== Stage 1: Build ======
FROM node:24.13.1-alpine AS builder

WORKDIR /usr

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ====== Stage 2: Production ======
FROM node:24.13.1-alpine

WORKDIR /usr

COPY package*.json ./
RUN npm install --only=production

# Copy built JS
COPY --from=builder /usr/dist ./dist

# Copy prisma folder (IMPORTANT)
COPY --from=builder /usr/prisma ./prisma

# Generate prisma client HERE
RUN npx prisma generate

EXPOSE 5333
CMD ["node", "dist/server.js"]
