FROM node:20-alpine

ENV NODE_ENV production

WORKDIR /app

COPY --chown=node:node dist/ .

EXPOSE 8080

USER node

CMD ["node", "dist/index.js"]
