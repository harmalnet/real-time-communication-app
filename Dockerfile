# syntax=docker/dockerfile:1

# --- Base stage ---
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install build dependencies
RUN apk add --no-cache python3 make g++

# --- Dependencies stage ---
FROM base AS deps
COPY package*.json ./
RUN npm ci --omit=dev

# --- Builder stage (for TypeScript) ---
FROM base AS builder
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY .eslintrc.js ./
COPY nodemon.json ./
RUN npm run build

# --- Runtime stage ---
FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only needed runtime files
COPY --from=deps /app/node_modules ./node_modules
COPY package*.json ./
COPY --from=builder /app/dist ./dist

EXPOSE 8080
CMD ["node", "dist/server.js"]
