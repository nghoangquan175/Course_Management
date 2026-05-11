# Build stage
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
# Copy migrations, seeders and config for production database tasks
COPY --from=build /app/migrations ./migrations
COPY --from=build /app/seeders ./seeders
COPY --from=build /app/.sequelizerc ./.sequelizerc
COPY --from=build /app/src/config ./dist/config

EXPOSE 5001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5001/api/health || exit 1

CMD ["node", "dist/server.js"]
