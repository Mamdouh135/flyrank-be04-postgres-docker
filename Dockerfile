# Use the official Node.js LTS image
FROM node:20-alpine

# Create app directory inside the container
WORKDIR /app

# Copy package files first (layer caching — only reinstalls when dependencies change)
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy the rest of the source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Start the server
CMD ["node", "index.js"]
