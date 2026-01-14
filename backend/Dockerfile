# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci --omit=dev

COPY src ./src

EXPOSE 5080
# 6. 启动命令
#   - 先初始化数据库 schema
#   - 再启动 API
CMD ["sh", "-c", "node src/db-init.js init && node src/index.js"]