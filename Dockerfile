# 基础镜像
FROM node:18-alpine


# 创建一个应用目录
WORKDIR /app
# 这个星号通配符意思是复制package.json和package-lock.json,复制到当前应用目录
COPY package*.json ./
# 安装应用依赖
RUN yarn install
# 安装完毕后复制当前目录所有文件到镜像目录里面
COPY . .
# 执行npm run build 后生成dist目录
RUN yarn build
RUN npx prisma generate
# RUN npx prisma migrate dev --name add init    
ENV NODE_ENV=production

# 容器对外暴露的端口号
EXPOSE 9093

# 使用打包后的镜像
CMD ["node","dist/src/main.js"]
# pnpm run prisma:deploy

# pnpm run prisma:generate