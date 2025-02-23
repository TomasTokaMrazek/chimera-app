FROM node:22.13.1-bookworm AS builder

WORKDIR /build

COPY package*.json .
RUN npm ci

COPY prisma/ ./prisma/
RUN npx prisma generate

COPY tsconfig.json .
COPY src/ ./src/
RUN npx tsc && npx tsc-alias

COPY config/ ./config/


FROM node:22.13.1-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY --from=builder build/package*.json .
COPY --from=builder build/prisma/ ./prisma/
COPY --from=builder build/dist/ ./dist/
COPY --from=builder build/config/ ./config/

RUN npm ci --omit=dev

USER node

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
