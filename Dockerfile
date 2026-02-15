# ====== Stage 1: Build ======
FROM node:24.13.1-alpine AS builder

WORKDIR /TransSeas

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ====== Stage 2: Production ======
FROM node:24.13.1-alpine

WORKDIR /TransSeas

COPY package*.json ./
RUN npm install --only=production

# Copy built JS
COPY --from=builder /TransSeas/dist ./dist

# Copy prisma folder (IMPORTANT)
COPY --from=builder /TransSeas/prisma ./prisma

# Generate prisma client HERE
RUN npx prisma generate

EXPOSE 5333
CMD ["node", "dist/server.js"]