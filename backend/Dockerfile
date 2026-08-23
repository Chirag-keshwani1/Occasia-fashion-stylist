FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
