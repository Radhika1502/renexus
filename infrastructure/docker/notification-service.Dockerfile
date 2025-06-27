# Sample Dockerfile for notification-service
FROM node:18-alpine
WORKDIR /app
COPY ../../Renexus/services/notification-service/package*.json ./
RUN npm install --production
COPY ../../Renexus/services/notification-service .
EXPOSE 4002
CMD ["npm", "start"]
