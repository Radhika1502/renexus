FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./apps/api/prisma/schema.prisma

# Build the application
RUN npm run build:api

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy Prisma schema and migrations
COPY --from=builder /app/apps/api/prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy built application
COPY --from=builder /app/dist/apps/api ./dist/

# Add health check script
COPY deployment/health-check.sh ./
RUN chmod +x ./health-check.sh

# Expose API port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production

# Run migrations and start the application
CMD ["sh", "-c", "npx prisma migrate deploy --schema=./prisma/schema.prisma && node dist/main.js"]
