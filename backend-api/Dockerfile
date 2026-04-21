# Use Node.js LTS
FROM node:20-alpine

# Set working directory
WORKDIR /app

COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the code
COPY . .

# Add entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose port
EXPOSE 5000

# Use entrypoint
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]