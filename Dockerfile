# ==========================================
# Stage 1: Builder
# ==========================================
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install all dependencies (including devDependencies for building)
RUN npm ci

# Copy source code and configuration
COPY apps/api ./apps/api
COPY apps/web ./apps/web
COPY prisma ./prisma
COPY tsconfig.json ./

# Generate Prisma client
RUN npx prisma generate

# Build both apps
RUN npm run build


# ==========================================
# Stage 2: Runner
# ==========================================
FROM node:18-alpine AS runner

# Set production environment
ENV NODE_ENV=production

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install only production dependencies
RUN npm ci --only=production

# Copy Prisma schema and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built artifacts from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist

# Expose application port
EXPOSE 3000

# Start the API server (which will serve static files in production)
CMD ["node", "apps/api/dist/index.js"]
