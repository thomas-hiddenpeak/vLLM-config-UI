# ============================================
# vLLM 配置生成器 - Docker 镜像
# ============================================
# 基于 Node.js 和 Python 的多阶段构建
# ============================================

# ---------- 阶段 1: 构建前端 ----------
FROM node:18-alpine AS frontend-builder

WORKDIR /app/frontend

# 复制 package 文件
COPY package*.json ./

# 安装依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建前端
RUN npm run build

# ---------- 阶段 2: 运行环境 ----------
FROM python:3.11-slim

# 设置环境变量
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 复制 Python 依赖文件
COPY requirements.txt .

# 安装 Python 依赖
RUN pip install --no-cache-dir -r requirements.txt

# 复制前端构建产物
COPY --from=frontend-builder /app/frontend/dist ./dist

# 复制后端服务
COPY server.py .

# 创建非 root 用户
RUN useradd --create-home --shell /bin/bash appuser && \
    chown -R appuser:appuser /app
USER appuser

# 暴露端口
EXPOSE 80 8000

# 健康检查
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/api/health || exit 1

# 启动服务
CMD ["sh", "-c", "python3 server.py 8000"]
