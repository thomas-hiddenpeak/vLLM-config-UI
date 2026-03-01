# Docker 部署指南

## 快速部署

### 1. 使用 Docker Compose（推荐）

```bash
# 克隆仓库
git clone <repository-url>
cd vllm-config-ui

# 启动服务
docker-compose up -d

# 查看运行状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

访问 http://localhost:8000

### 2. 使用 Docker 命令

```bash
# 构建镜像
docker build -t vllm-config-ui .

# 运行容器
docker run -d \
  -p 8000:8000 \
  --name vllm-config \
  vllm-config-ui

# 查看日志
docker logs -f vllm-config

# 停止容器
docker stop vllm-config
docker rm vllm-config
```

## 生产环境部署

### 1. 配置 Nginx

编辑 `nginx.conf`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }

    # 后端 API 代理
    location /api/ {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

### 2. 配置 SSL（可选）

准备 SSL 证书文件：
```bash
mkdir -p ssl
cp /path/to/fullchain.pem ssl/
cp /path/to/privkey.pem ssl/
```

启用 HTTPS：
```bash
docker-compose --profile production up -d
```

### 3. 环境变量配置

创建 `.env` 文件：

```bash
# 服务端口
BACKEND_PORT=8000
NGINX_PORT=80
NGINX_SSL_PORT=443

# 缓存目录
MODELSCOPE_CACHE_PATH=/data/modelscope/cache
HUGGINGFACE_CACHE_PATH=/data/huggingface/cache
```

## 数据持久化

### 使用 Docker 卷

```yaml
volumes:
  modelscope-cache:
    driver: local
  huggingface-cache:
    driver: local
```

### 挂载主机目录

```yaml
volumes:
  - /host/path/modelscope:/home/appuser/.cache/modelscope
  - /host/path/huggingface:/home/appuser/.cache/huggingface
```

## 性能优化

### 1. 调整资源限制

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '4.0'
          memory: 4G
        reservations:
          cpus: '1.0'
          memory: 1G
```

### 2. 启用缓存

```bash
# 创建缓存卷
docker volume create vllm-modelscope-cache
docker volume create vllm-huggingface-cache

# 启动时挂载
docker-compose up -d
```

### 3. 配置日志轮转

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

## 故障排查

### 容器无法启动

```bash
# 查看容器状态
docker-compose ps

# 查看详细日志
docker-compose logs backend

# 检查端口占用
docker ps
netstat -tlnp | grep 8000
```

### API 无法访问

```bash
# 测试后端健康检查
curl http://localhost:8000/api/health

# 测试 Nginx 代理
curl http://localhost/api/health
```

### 缓存问题

```bash
# 清除缓存卷
docker volume rm vllm-modelscope-cache
docker volume rm vllm-huggingface-cache

# 重启服务
docker-compose restart
```

### 重建镜像

```bash
# 强制重建
docker-compose build --no-cache
docker-compose up -d
```

## 备份与恢复

### 备份数据卷

```bash
# 备份 ModelScope 缓存
docker run --rm \
  -v vllm-modelscope-cache:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/modelscope-cache.tar.gz -C /source .

# 备份 HuggingFace 缓存
docker run --rm \
  -v vllm-huggingface-cache:/source \
  -v $(pwd):/backup \
  alpine tar czf /backup/huggingface-cache.tar.gz -C /source .
```

### 恢复数据卷

```bash
# 恢复 ModelScope 缓存
docker run --rm \
  -v vllm-modelscope-cache:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/modelscope-cache.tar.gz -C /target

# 恢复 HuggingFace 缓存
docker run --rm \
  -v vllm-huggingface-cache:/target \
  -v $(pwd):/backup \
  alpine tar xzf /backup/huggingface-cache.tar.gz -C /target
```

## 高可用部署

### 多副本部署

编辑 `docker-compose.yml`：

```yaml
services:
  backend:
    deploy:
      replicas: 2
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

### 负载均衡

使用 Nginx 进行负载均衡：

```nginx
upstream backend_servers {
    server backend1:8000;
    server backend2:8000;
}

server {
    location /api/ {
        proxy_pass http://backend_servers;
    }
}
```

## 监控与日志

### Prometheus 监控

添加 Prometheus 配置：

```yaml
scrape_configs:
  - job_name: 'vllm-config'
    static_configs:
      - targets: ['backend:8000']
```

### ELK 日志收集

配置 Filebeat：

```yaml
filebeat.inputs:
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log
```

## 常见问题

### Q: 如何更新镜像？

```bash
docker-compose pull
docker-compose up -d --force-recreate
```

### Q: 如何查看容器 IP？

```bash
docker inspect vllm-config-backend | grep IPAddress
```

### Q: 如何限制带宽？

编辑 `nginx.conf`：

```nginx
location /api/ {
    limit_rate 10m;
    limit_rate_after 100m;
}
```

### Q: 如何启用跨域？

编辑 `nginx.conf`：

```nginx
location /api/ {
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS';
    add_header Access-Control-Allow-Headers 'Content-Type';
}
```

## 安全建议

1. **启用 HTTPS** - 生产环境必须使用 HTTPS
2. **配置防火墙** - 只开放必要端口
3. **使用非 root 用户** - Dockerfile 中已配置
4. **定期更新镜像** - 保持最新安全补丁
5. **限制 API 访问** - 使用 API Key 认证
6. **日志审计** - 启用访问日志记录
