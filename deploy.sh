#!/bin/bash

# ============================================
# vLLM 配置生成器 - 一键部署脚本
# ============================================

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查系统依赖..."
    
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose 未安装，请先安装 Docker Compose"
        exit 1
    fi
    
    log_success "依赖检查通过"
}

# 构建前端
build_frontend() {
    log_info "构建前端..."
    
    if [ -d "node_modules" ]; then
        log_info "使用本地 Node.js 构建..."
        npm install
        npm run build
    else
        log_info "使用 Docker 构建..."
        docker-compose --profile build build frontend
    fi
    
    log_success "前端构建完成"
}

# 启动服务
start_services() {
    local profile=$1
    
    log_info "启动服务..."
    
    if [ "$profile" == "production" ]; then
        docker-compose --profile production up -d
    else
        docker-compose up -d backend
    fi
    
    log_success "服务启动完成"
}

# 健康检查
health_check() {
    log_info "等待服务启动..."
    sleep 5
    
    log_info "检查后端服务..."
    if curl -f http://localhost:8000/api/health &> /dev/null; then
        log_success "后端服务正常"
    else
        log_warning "后端服务可能未正常启动，请查看日志：docker-compose logs backend"
    fi
    
    if [ -f "nginx.conf" ]; then
        log_info "检查 Nginx 服务..."
        if curl -f http://localhost/health &> /dev/null; then
            log_success "Nginx 服务正常"
        else
            log_warning "Nginx 服务可能未正常启动，请查看日志：docker-compose logs nginx"
        fi
    fi
}

# 显示访问信息
show_access_info() {
    echo ""
    log_success "部署完成！"
    echo ""
    echo "访问地址:"
    echo "  - 前端：http://localhost"
    echo "  - 后端 API: http://localhost:8000"
    echo "  - 健康检查：http://localhost:8000/api/health"
    echo ""
    echo "常用命令:"
    echo "  - 查看日志：docker-compose logs -f"
    echo "  - 停止服务：docker-compose down"
    echo "  - 重启服务：docker-compose restart"
    echo ""
}

# 主函数
main() {
    echo ""
    echo "============================================"
    echo "  vLLM 配置生成器 - Docker 部署"
    echo "============================================"
    echo ""
    
    # 检查依赖
    check_dependencies
    
    # 选择部署模式
    DEPLOY_MODE=${1:-simple}
    
    case $DEPLOY_MODE in
        simple)
            log_info "简单部署模式（仅后端）"
            build_frontend
            start_services
            health_check
            show_access_info
            ;;
        production)
            log_info "生产部署模式（后端 + Nginx）"
            build_frontend
            start_services production
            health_check
            show_access_info
            ;;
        clean)
            log_info "清理部署..."
            docker-compose down -v
            log_success "清理完成"
            ;;
        *)
            echo "用法：$0 [simple|production|clean]"
            echo ""
            echo "  simple     - 简单部署（仅后端，默认）"
            echo "  production - 生产部署（后端 + Nginx）"
            echo "  clean      - 清理部署"
            echo ""
            exit 1
            ;;
    esac
}

# 执行主函数
main "$@"
