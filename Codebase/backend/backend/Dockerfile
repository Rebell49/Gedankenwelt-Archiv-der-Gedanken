# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

# Runtime stage
FROM node:20-alpine
WORKDIR /app

# Health check dependency
RUN apk add --no-cache curl

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

COPY src ./src
COPY prisma ./prisma
COPY package*.json ./

# Generate Prisma client
RUN npx prisma generate

EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["npm", "run", "start"]
