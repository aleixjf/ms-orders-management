# ? Stage 1: Build the application
FROM node:22-alpine AS builder

# Create and change to the app directory
WORKDIR /app

# Install Node.js, npm and the Nest CLI
RUN npm install -g npm@11
RUN npm install -g @nestjs/cli

# Copy the application code to the app directory
COPY . .

# Delete the keys directory (except the file with our KEY_FILE name)
# ARG KEY_FILE
# RUN find keys ! -name "${KEY_FILE}" -type f -exec rm -f {} +

# Install Node.js dependencies
RUN npm install

# Build the application
RUN npm run build

# ? Stage 2: Create a minimal runtime image
FROM node:22-alpine AS runtime

# Create and change to the app directory
WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/keys ./keys
COPY --from=builder /app/package.json .

# Expose the port (for HTTP and Socket protocols) that the application will run on
EXPOSE 3000

# Expose the port (for gRPC protocol) that the application will run on
EXPOSE 50051

# Set the environment variables for production
ENV NODE_ENV="production"

# Start the application with the specified environment
CMD ["sh", "-c", "npm run serve:prod"]
