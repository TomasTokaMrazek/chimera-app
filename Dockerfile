FROM node:22.10.0-bookworm

ENV NODE_ENV production

WORKDIR /app

COPY --chown=node:node dist/ .

EXPOSE 3000 3001

USER node

CMD ["node", "dist/main.js"]
