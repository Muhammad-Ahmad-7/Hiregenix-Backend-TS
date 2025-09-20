# Use official Node 18 image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the entire project
COPY . .

# Build TypeScript
RUN npm run build

# Expose API port
EXPOSE 3000

# Start server
CMD ["npm", "run", "start"]
