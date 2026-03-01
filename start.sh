#!/bin/bash
# vLLM 配置生成器 - 快速启动脚本

echo "🚀 vLLM 配置生成器"
echo "=================="
echo ""

# 检查 Python
if ! command -v python3 &> /dev/null; then
    echo "❌ 错误：需要 Python 3"
    exit 1
fi

# 启动服务器（默认 8000 端口，因为 5000 可能被 macOS AirPlay 占用）
echo "📡 启动服务器..."
python3 server.py ${1:-8000}
