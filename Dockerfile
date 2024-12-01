FROM node:22.10.0-bookworm

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci

USER node

COPY --chown=node:node prisma/ ./prisma/
COPY --chown=node:node src/ ./src/

RUN npx tsc && npx tsc-alias

EXPOSE 3000 3001

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
