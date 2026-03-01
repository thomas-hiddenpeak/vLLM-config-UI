# vLLM 配置生成器

一个功能完整的 vLLM serve 配置生成器 Web UI，支持所有 113+ 个 vLLM 启动参数和环境变量配置。

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)

**[English Documentation](README.md)**

## ✨ 功能特性

### 🎯 核心功能

- **完整参数支持** - 支持全部 113+ 个 vLLM serve 启动参数
- **双平台模型搜索** - 支持 HuggingFace 和 ModelScope 两个平台的模型搜索
- **实时 VRAM 计算** - 根据模型参数量、量化精度、上下文长度实时计算显存占用
- **多 GPU 设备兼容性检查** - 自动检查配置是否可在目标 GPU 上运行
- **配置导入/导出** - 支持 YAML 配置文件的导入和导出
- **命令行生成** - 一键生成 vLLM serve 启动命令
- **环境变量配置** - 支持所有 vLLM 相关环境变量配置

### 🌐 国际化

- 完整的中文/英文双语支持
- 自动检测浏览器语言
- 语言偏好本地存储

### 📊 配置类别

| 类别 | 参数数量 |
|------|---------|
| 核心模型配置 | 15 |
| 分布式与并行 | 9 |
| 内存与缓存 | 12 |
| 调度器 | 6 |
| 量化 | 2 |
| RoPE 配置 | 4 |
| Tokenizer 池 | 3 |
| LoRA 适配器 | 9 |
| 推测解码 | 11 |
| 多模态 | 2 |
| API 服务器 | 19 |
| 日志与监控 | 5 |
| 其他配置 | 4 |
| 环境变量 | 12 |
| **总计** | **113** |

## 🚀 快速开始

### 环境要求

- Node.js v18+
- Python 3.8+
- npm v8+

### 安装依赖

```bash
cd vllm-config-ui
npm install
```

### 安装 Python 依赖（可选，用于模型搜索）

```bash
pip install -r requirements.txt
# 或手动安装：
# pip install modelscope huggingface_hub
```

### 启动开发服务器

#### 方式一：仅前端（使用示例数据）

```bash
npm run dev
```

访问 http://localhost:3000

#### 方式二：前端 + 后端（完整功能）

```bash
# 终端 1 - 启动前端
npm run dev:frontend

# 终端 2 - 启动后端
npm run dev:backend
# 或
python3 server.py
```

## 🐳 Docker 部署

### 构建镜像

```bash
docker build -t vllm-config-ui .
```

### 运行容器

```bash
docker run -d -p 8000:8000 --name vllm-config vllm-config-ui
```

访问 http://localhost:8000

### Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问 http://localhost:8000

## 📖 使用说明

### 1. 选择模型

点击"🔍 搜索模型"按钮，可以选择：
- **HuggingFace** - 搜索 HuggingFace Hub 上的模型
- **ModelScope** - 搜索 ModelScope 上的模型

### 2. 配置参数

在右侧配置表单中调整参数，所有参数分为 14 个类别：

1. **核心模型配置** - 模型名称、分词器、数据类型等
2. **分布式与并行** - 张量并行、流水线并行等
3. **内存与缓存** - GPU 内存利用率、KV 缓存等
4. **调度器** - 最大序列数、分块预填充等
5. **量化** - 量化方法选择
6. **RoPE 配置** - RoPE 相关参数
7. **Tokenizer 池** - Tokenizer 进程池配置
8. **LoRA 适配器** - LoRA 相关配置
9. **推测解码** - 推测解码配置
10. **多模态** - 多模态输入限制
11. **API 服务器** - 主机、端口、SSL 等
12. **日志与监控** - 日志和监控配置
13. **其他配置** - 设备类型、种子等
14. **环境变量** - vLLM 相关环境变量

### 3. 查看显存占用

顶部栏实时显示显存占用情况：
- 蓝色：模型权重占用
- 绿色：KV 缓存占用
- 右侧显示设备兼容性检查

### 4. 生成配置

左侧预览窗口显示三种格式：
- **YAML** - vLLM 配置文件格式
- **命令行** - vLLM serve 启动命令
- **环境变量** - 环境变量配置

点击对应按钮可复制或下载配置。

## 📁 项目结构

```
vllm-config-ui/
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── store.ts             # MobX 状态管理
│   ├── style.css            # 样式文件
│   ├── i18n.ts              # 国际化配置
│   └── locales/             # 翻译文件
│       ├── zh.json          # 中文翻译
│       └── en.json          # 英文翻译
├── server.py                # Python 后端 API├── requirements.txt         # Python 依赖├── Dockerfile               # Docker 构建配置
├── docker-compose.yml       # Docker Compose 配置
├── nginx.conf               # Nginx 配置
├── package.json             # Node.js 依赖
├── README.md                # 英文文档
├── README_zh.md             # 中文文档
└── DEPLOYMENT.md            # 部署指南
```

## 🔌 API 接口

### 后端 API (server.py)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检查 |
| `/api/huggingface/search` | POST | 搜索 HuggingFace 模型 |
| `/api/modelscope/search` | POST | 搜索 ModelScope 模型 |

### 请求示例

```bash
# 搜索 HuggingFace 模型
curl -X POST http://localhost:8000/api/huggingface/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Qwen", "page": 1, "page_size": 20, "sort_by": "downloads"}'

# 搜索 ModelScope 模型
curl -X POST http://localhost:8000/api/modelscope/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Qwen", "page": 1, "page_size": 20, "sort_by": "downloads"}'
```

## 🎨 技术栈

- **前端**
  - React 18
  - MobX 6
  - TypeScript 5
  - i18next
  - Parcel (构建工具)

- **后端**
  - Python 3
  - ModelScope SDK
  - HuggingFace Hub SDK

## 📝 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- [vLLM](https://github.com/vllm-project/vllm) - 高性能 LLM 推理框架
- [HuggingFace](https://huggingface.co/) - 模型平台
- [ModelScope](https://modelscope.cn/) - 魔搭社区
- [WebCell](https://github.com/EasyWebApp/webcell) - 前端框架

## 📬 联系方式

如有问题或建议，请提交 Issue 或 Pull Request。
