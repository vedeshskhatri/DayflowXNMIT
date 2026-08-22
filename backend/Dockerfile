# ---- base ----
FROM node:20-alpine AS base
WORKDIR /app
COPY package*.json ./

# ---- dev (used by docker-compose for local hackathon dev) ----
FROM base AS dev
RUN apk add --no-cache openssl
RUN npm install
COPY . .
EXPOSE 4000
CMD ["npm", "run", "dev"]

# ---- builder (prod) ----
FROM base AS builder
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

# ---- runner (prod) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
RUN npx prisma generate
EXPOSE 4000
CMD ["node", "dist/server.js"]
