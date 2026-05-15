FROM node:20-alpine

WORKDIR /app

COPY package.json ./
COPY src ./src

RUN mkdir -p /app/data

ENV PORT=4000
ENV LEDGER_PATH=/app/data/events.json

EXPOSE 4000

CMD ["npm", "start"]
