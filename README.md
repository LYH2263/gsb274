# CodeEdu - 在线编程教育平台

一个基于 Web 的代码实时协作与回放系统，支持教师录制编程过程、学生回放学习，以及学生行为分析功能。

## 🛠 技术栈

### Frontend
- **框架**: React 18 + Next.js 14
- **编辑器**: Monaco Editor (VS Code 核心)
- **UI 组件**: Tailwind CSS + Shadcn/ui
- **状态管理**: Zustand
- **实时通信**: Socket.io-client
- **图表**: Recharts (热力图/频率曲线)

### Backend
- **框架**: NestJS 10
- **数据库**: MongoDB 7.0 + Mongoose
- **缓存**: Redis 7
- **实时通信**: Socket.io
- **认证**: JWT + Passport
- **文档**: Swagger/OpenAPI

### Infrastructure
- **容器化**: Docker + Docker Compose
- **数据持久化**: Docker Volumes

## 🚀 启动指南 (How to Run)

1. 确保 Docker Desktop 已启动
2. 在根目录执行：
   ```bash
   docker compose up --build
   ```
3. 等待容器启动完成（首次构建约需 3-5 分钟）

## 🔗 服务地址 (Services)

| 服务 | 地址 |
|------|------|
| 前端应用 | http://localhost:3000 |
| 后端 API | http://localhost:8000 |
| API 文档 (Swagger) | http://localhost:8000/api/docs |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |

## 🧪 测试账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 教师 | teacher@codeedu.com | 123456 |
| 学生 | student@codeedu.com | 123456 |

## ✨ 核心功能

### 1. 代码编辑器
- 集成 Monaco Editor，支持多语言语法高亮
- 智能代码补全
- 多主题切换（亮色/暗色）

### 2. 录制与回放系统
- **操作指令记录**: 基于 Operational Transformation (OT) 算法
- **状态快照**: 定期保存编辑器状态
- **回放控制**: 支持快进、快退、倍速播放 (0.5x - 4x)
- **进度条交互**: 可拖拽跳转到任意时间点

### 3. 学生行为分析
- **输入频率热力图**: 展示单位时间内的输入事件密度
- **频率曲线图**: 可视化编程活跃度变化
- **进度条热力层**: 直观显示编程高峰时段

### 4. 实时协作
- 基于 Socket.io 的实时同步
- 多用户同时编辑支持
- 光标位置实时显示

## 📁 项目结构

```
taskId274/
├── docker-compose.yml      # Docker 编排配置
├── README.md               # 项目说明文档
├── frontend/               # Next.js 前端
│   ├── Dockerfile
│   ├── package.json
│   ├── src/
│   │   ├── app/            # Next.js App Router
│   │   ├── components/     # React 组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   ├── lib/            # 工具库
│   │   ├── store/          # Zustand 状态
│   │   └── types/          # TypeScript 类型
│   └── ...
└── backend/                # NestJS 后端
    ├── Dockerfile
    ├── package.json
    ├── src/
    │   ├── main.ts         # 入口文件
    │   ├── app.module.ts   # 根模块
    │   ├── auth/           # 认证模块
    │   ├── users/          # 用户模块
    │   ├── sessions/       # 编程会话模块
    │   ├── recordings/     # 录制模块
    │   ├── analytics/      # 分析模块
    │   └── gateway/        # WebSocket 网关
    └── ...
```

## 🗄️ 数据库设计

### Users Collection
- 用户信息（教师/学生）
- 认证凭据

### Sessions Collection
- 编程会话信息
- 参与者列表
- 会话状态

### Recordings Collection
- 操作序列 (Deltas)
- 状态快照
- 时间戳索引

### Analytics Collection
- 输入事件统计
- 行为分析数据

## 🔧 开发说明

### 本地开发（非 Docker）

**后端**:
```bash
cd backend
npm install
npm run start:dev
```

**前端**:
```bash
cd frontend
npm install
npm run dev
```

### 环境变量

后端 `.env`:
```env
NODE_ENV=development
PORT=8000
MONGODB_URI=mongodb://admin:admin123@localhost:27017/codeedu?authSource=admin
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-jwt-secret
CORS_ORIGIN=http://localhost:3000
```

## 📝 API 文档

启动后端服务后，访问 http://localhost:8000/api/docs 查看完整的 Swagger API 文档。

## 🐳 Docker 配置说明

- **MongoDB**: 持久化存储，数据保存在 `mongodb_data` 卷
- **Redis**: 用于操作序列缓存和实时同步
- **Backend**: NestJS 应用，端口 8000
- **Frontend**: Next.js 应用，端口 3000

## 📄 License

MIT License
