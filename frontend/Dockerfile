FROM node:20-alpine

WORKDIR /workspace
COPY . .

RUN set -eux; \
    if [ -f /workspace/frontend/package.json ]; then \
      SRC=/workspace/frontend; \
    elif [ -f /workspace/package.json ]; then \
      SRC=/workspace; \
    else \
      echo "No frontend package.json found in build context" >&2; \
      exit 1; \
    fi; \
    mkdir -p /app; \
    cp -R "$SRC"/. /app/

WORKDIR /app
RUN npm ci
RUN npm run build

EXPOSE 8080 4080

CMD ["sh", "-c", "echo \"Starting Next on PORT=${PORT:-8080}\" && node scripts/port-proxy.mjs & npm start -- -p ${PORT:-8080} -H 0.0.0.0"]
