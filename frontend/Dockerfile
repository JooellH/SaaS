FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

EXPOSE 8080 4080
 
CMD ["sh", "-c", "echo \"Starting Next on PORT=${PORT:-8080}\" && node scripts/port-proxy.mjs & npm start -- -p ${PORT:-8080} -H 0.0.0.0"]
