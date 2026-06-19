# 构建阶段
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 配置 npm 镜像并安装依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM node:20-alpine AS production

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 只安装生产依赖
RUN npm config set registry https://registry.npmmirror.com && \
    npm ci --only=production

# 从构建阶段复制构建产物
COPY --from=builder /app/dist ./dist

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=8000

# 暴露端口
EXPOSE 8000

# 启动应用
CMD ["node", "dist/main"]
