FROM python:3.13-alpine

WORKDIR /app

COPY anomaly.py ./
COPY server.py ./

ENV PORT=5000
ENV BLOCKCHAIN_API_URL=http://blockchain-api:4000

EXPOSE 5000

CMD ["python", "server.py"]
