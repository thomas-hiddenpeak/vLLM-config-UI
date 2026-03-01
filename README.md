# vLLM Configuration Generator

A complete vLLM serve configuration generator Web UI with support for all 113+ vLLM startup parameters and environment variables.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)

**[中文文档](README_zh.md)**

## ✨ Features

### 🎯 Core Features

- **Complete Parameter Support** - Support for all 113+ vLLM serve startup parameters
- **Dual Platform Model Search** - Support for HuggingFace and ModelScope model search
- **Real-time VRAM Calculation** - Real-time VRAM usage based on model parameters, quantization precision, and context length
- **Multi-GPU Device Compatibility Check** - Automatically checks if configuration can run on target GPU
- **Configuration Import/Export** - Support for YAML configuration file import and export
- **Command Line Generation** - One-click vLLM serve command generation
- **Environment Variables Configuration** - Support for all vLLM-related environment variables

### 🌐 Internationalization

- Complete Chinese/English bilingual support
- Automatic browser language detection
- Language preference local storage

### 📊 Configuration Categories

| Category | Parameters |
|----------|------------|
| Core Model Configuration | 15 |
| Distributed & Parallel | 9 |
| Memory & Cache | 12 |
| Scheduler | 6 |
| Quantization | 2 |
| RoPE Configuration | 4 |
| Tokenizer Pool | 3 |
| LoRA Adapters | 9 |
| Speculative Decoding | 11 |
| Multi-modal | 2 |
| API Server | 19 |
| Logging & Monitoring | 5 |
| Other Configuration | 4 |
| Environment Variables | 12 |
| **Total** | **113** |

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- Python 3.8+
- npm v8+

### Install Dependencies

```bash
cd vllm-config-ui
npm install
```

### Install Python Dependencies (Optional, for model search)

```bash
pip install -r requirements.txt
# or install manually:
# pip install modelscope huggingface_hub
```

### Start Development Server

#### Option 1: Frontend Only (with sample data)

```bash
npm run dev
```

Visit http://localhost:3000

#### Option 2: Frontend + Backend (Full Features)

```bash
# Terminal 1 - Start frontend
npm run dev:frontend

# Terminal 2 - Start backend
npm run dev:backend
# or
python3 server.py
```

## 🐳 Docker Deployment

### Build Image

```bash
docker build -t vllm-config-ui .
```

### Run Container

```bash
docker run -d -p 8000:8000 --name vllm-config vllm-config-ui
```

### Docker Compose

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

Visit http://localhost:8000

## 📖 Usage Guide

### 1. Select Model

Click "🔍 Search Models" button to choose:
- **HuggingFace** - Search models on HuggingFace Hub
- **ModelScope** - Search models on ModelScope

### 2. Configure Parameters

Adjust parameters in the right configuration form. All parameters are divided into 14 categories:

1. **Core Model** - Model name, tokenizer, data type, etc.
2. **Distributed & Parallel** - Tensor parallel, pipeline parallel, etc.
3. **Memory & Cache** - GPU memory utilization, KV cache, etc.
4. **Scheduler** - Max sequences, chunked prefill, etc.
5. **Quantization** - Quantization method selection
6. **RoPE** - RoPE related parameters
7. **Tokenizer Pool** - Tokenizer process pool configuration
8. **LoRA** - LoRA related configuration
9. **Speculative Decoding** - Speculative decoding configuration
10. **Multi-modal** - Multi-modal input limits
11. **API Server** - Host, port, SSL, etc.
12. **Logging & Monitoring** - Logging and monitoring configuration
13. **Other** - Device type, seed, etc.
14. **Environment Variables** - vLLM related environment variables

### 3. View VRAM Usage

Top bar shows real-time VRAM usage:
- Blue: Model weights usage
- Green: KV cache usage
- Right side shows device compatibility check

### 4. Generate Configuration

Left preview window shows three formats:
- **YAML** - vLLM configuration file format
- **Command Line** - vLLM serve startup command
- **Environment Variables** - Environment variable configuration

Click corresponding buttons to copy or download configuration.

## 📁 Project Structure

```
vllm-config-ui/
├── src/
│   ├── App.tsx              # Main application component
│   ├── store.ts             # MobX state management
│   ├── style.css            # Style files
│   ├── i18n.ts              # Internationalization configuration
│   └── locales/             # Translation files
│       ├── zh.json          # Chinese translation
│       └── en.json          # English translation
├── server.py                # Python backend API
├── requirements.txt         # Python dependencies
├── Dockerfile               # Docker build configuration
├── docker-compose.yml       # Docker Compose configuration
├── nginx.conf               # Nginx configuration
├── package.json             # Node.js dependencies
├── README.md                # This file (English)
├── README_zh.md             # Chinese README
└── DEPLOYMENT.md            # Deployment guide
```

## 🔌 API Endpoints

### Backend API (server.py)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/huggingface/search` | POST | Search HuggingFace models |
| `/api/modelscope/search` | POST | Search ModelScope models |

### Request Example

```bash
# Search HuggingFace models
curl -X POST http://localhost:8000/api/huggingface/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Qwen", "page": 1, "page_size": 20, "sort_by": "downloads"}'

# Search ModelScope models
curl -X POST http://localhost:8000/api/modelscope/search \
  -H "Content-Type: application/json" \
  -d '{"query": "Qwen", "page": 1, "page_size": 20, "sort_by": "downloads"}'
```

## 🎨 Tech Stack

- **Frontend**
  - React 18
  - MobX 6
  - TypeScript 5
  - i18next
  - Parcel (Build tool)

- **Backend**
  - Python 3
  - ModelScope SDK
  - HuggingFace Hub SDK

## 📝 License

MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [vLLM](https://github.com/vllm-project/vllm) - High-performance LLM inference framework
- [HuggingFace](https://huggingface.co/) - Model platform
- [ModelScope](https://modelscope.cn/) - Model community
- [WebCell](https://github.com/EasyWebApp/webcell) - Frontend framework

## 📬 Contact

For issues or suggestions, please submit an Issue or Pull Request.
