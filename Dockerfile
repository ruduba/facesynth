FROM node:18-slim

WORKDIR /app

# Install OpenSSL and build tools
RUN apt-get update && apt-get install -y \
    openssl \
    python3 \
    make \
    g++ \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma

RUN npm install && npx prisma generate

COPY . .

RUN mkdir -p uploads

EXPOSE 3000

CMD ["sh", "-c", "npx prisma generate && npx prisma migrate deploy && npm run seed && npm run dev"]