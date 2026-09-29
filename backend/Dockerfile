FROM node:22-alpine

ENV NODE_ENV=production

WORKDIR /app/backend

COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund \
    && npm cache clean --force

COPY backend/server.js ./server.js
COPY backend/src ./src
COPY docs/schema /app/docs/schema

RUN mkdir -p /app/backend/uploads/screenshots \
    && chown -R node:node /app

USER node

EXPOSE 3000

CMD ["node", "server.js"]

