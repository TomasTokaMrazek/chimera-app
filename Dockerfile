FROM node:20.15.1-bookworm

ENV NODE_ENV production

WORKDIR /app

COPY --chown=node:node dist/ .

EXPOSE 8080

USER node

CMD ["node", "dist/index.js"]
