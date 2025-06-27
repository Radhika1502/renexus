FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build:web

# Production stage with Nginx
FROM nginx:alpine AS production

# Copy built application
COPY --from=builder /app/dist/apps/web-client /usr/share/nginx/html

# Copy Nginx configuration
COPY deployment/nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Add health check endpoint
RUN echo "location /health { return 200 'healthy'; }" >> /etc/nginx/conf.d/default.conf

# Expose ports
EXPOSE 80
EXPOSE 443

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
