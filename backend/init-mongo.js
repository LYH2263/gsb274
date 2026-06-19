// MongoDB 初始化脚本
// 创建数据库和用户

db = db.getSiblingDB('codeedu');

// 创建集合
db.createCollection('users');
db.createCollection('sessions');
db.createCollection('recordings');
db.createCollection('analytics');

// 创建索引
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ role: 1 });

db.sessions.createIndex({ creatorId: 1 });
db.sessions.createIndex({ status: 1 });
db.sessions.createIndex({ createdAt: -1 });

db.recordings.createIndex({ sessionId: 1 });
db.recordings.createIndex({ userId: 1 });
db.recordings.createIndex({ createdAt: -1 });

db.analytics.createIndex({ recordingId: 1 });
db.analytics.createIndex({ userId: 1 });
db.analytics.createIndex({ sessionId: 1 });

// 插入测试用户（密码已使用 bcrypt 加密，明文为 123456）
const hashedPassword = '$2a$10$NYnKCW.BZiiOoRqtc2RwD.J6332Ij0WnvOyyPyxYAxTtXNqLOTfOy';

// 教师账号
db.users.insertOne({
  email: 'teacher@codeedu.com',
  password: hashedPassword,
  username: '张老师',
  avatar: '',
  role: 'teacher',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 学生账号
db.users.insertOne({
  email: 'student@codeedu.com',
  password: hashedPassword,
  username: '李同学',
  avatar: '',
  role: 'student',
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
});

// 插入示例会话
const teacher = db.users.findOne({ email: 'teacher@codeedu.com' });

db.sessions.insertOne({
  title: 'JavaScript 基础入门',
  description: '学习 JavaScript 变量、函数和控制流程',
  language: 'javascript',
  creatorId: teacher._id,
  participants: [],
  status: 'pending',
  initialCode: '// JavaScript 基础入门\n// 欢迎来到编程世界！\n\n// 变量声明\nlet message = "Hello, World!";\nconsole.log(message);\n',
  currentCode: '// JavaScript 基础入门\n// 欢迎来到编程世界！\n\n// 变量声明\nlet message = "Hello, World!";\nconsole.log(message);\n',
  duration: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.sessions.insertOne({
  title: 'Python 数据分析',
  description: '使用 Python 进行数据处理和分析',
  language: 'python',
  creatorId: teacher._id,
  participants: [],
  status: 'pending',
  initialCode: '# Python 数据分析入门\nimport pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {\n    "name": ["Alice", "Bob", "Charlie"],\n    "age": [25, 30, 35],\n    "score": [85, 90, 88]\n}\n\ndf = pd.DataFrame(data)\nprint(df)\n',
  currentCode: '# Python 数据分析入门\nimport pandas as pd\nimport numpy as np\n\n# 创建示例数据\ndata = {\n    "name": ["Alice", "Bob", "Charlie"],\n    "age": [25, 30, 35],\n    "score": [85, 90, 88]\n}\n\ndf = pd.DataFrame(data)\nprint(df)\n',
  duration: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

db.sessions.insertOne({
  title: 'TypeScript 高级特性',
  description: '深入学习 TypeScript 类型系统',
  language: 'typescript',
  creatorId: teacher._id,
  participants: [],
  status: 'pending',
  initialCode: '// TypeScript 高级特性\n\n// 泛型示例\nfunction identity<T>(arg: T): T {\n    return arg;\n}\n\n// 接口定义\ninterface User {\n    id: number;\n    name: string;\n    email: string;\n}\n\n// 使用接口\nconst user: User = {\n    id: 1,\n    name: "John",\n    email: "john@example.com"\n};\n\nconsole.log(user);\n',
  currentCode: '// TypeScript 高级特性\n\n// 泛型示例\nfunction identity<T>(arg: T): T {\n    return arg;\n}\n\n// 接口定义\ninterface User {\n    id: number;\n    name: string;\n    email: string;\n}\n\n// 使用接口\nconst user: User = {\n    id: 1,\n    name: "John",\n    email: "john@example.com"\n};\n\nconsole.log(user);\n',
  duration: 0,
  createdAt: new Date(),
  updatedAt: new Date()
});

print('MongoDB initialization completed!');
print('Created users: teacher@codeedu.com, student@codeedu.com');
print('Password for all users: 123456');
