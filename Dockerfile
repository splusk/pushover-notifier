FROM node:22 AS frontend
WORKDIR /app/frontend
COPY frontend/package*.json frontend/package-lock.json ./
RUN npm install
COPY frontend ./
RUN npm run build

FROM node:22 AS backend
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/*.js ./
RUN npm install

COPY --from=frontend /app/frontend/dist ./public

CMD ["node", "server.js"]
