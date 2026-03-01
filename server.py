#!/usr/bin/env python3
"""
vLLM Configuration Generator - Backend API Server
提供模型搜索功能的后端服务
"""

import json
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import logging

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('server.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# 尝试导入模型搜索库
try:
    from modelscope.hub.api import HubApi as ModelScopeApi
    MODELSCOPE_AVAILABLE = True
    logger.info("ModelScope SDK loaded successfully")
except ImportError:
    MODELSCOPE_AVAILABLE = False
    logger.warning("ModelScope SDK not available. ModelScope search will be disabled.")

try:
    from huggingface_hub import HfApi
    HUGGINGFACE_AVAILABLE = True
    logger.info("HuggingFace Hub SDK loaded successfully")
except ImportError:
    HUGGINGFACE_AVAILABLE = False
    logger.warning("HuggingFace Hub SDK not available. HuggingFace search will be disabled.")


class APIHandler(BaseHTTPRequestHandler):
    """HTTP请求处理器"""
    
    def _set_cors_headers(self):
        """设置CORS头"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def _send_json_response(self, data, status=200):
        """发送JSON响应"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._set_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def _send_error_response(self, message, status=500):
        """发送错误响应"""
        self._send_json_response({
            'success': False,
            'error': message
        }, status)
    
    def do_OPTIONS(self):
        """处理OPTIONS请求（CORS预检）"""
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()
    
    def do_GET(self):
        """处理GET请求"""
        parsed_path = urlparse(self.path)
        
        if parsed_path.path == '/api/health':
            self._send_json_response({
                'status': 'ok',
                'modelscope_available': MODELSCOPE_AVAILABLE,
                'huggingface_available': HUGGINGFACE_AVAILABLE
            })
        else:
            self._send_error_response('Not Found', 404)
    
    def do_POST(self):
        """处理POST请求"""
        parsed_path = urlparse(self.path)
        
        # 读取请求体
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        try:
            data = json.loads(body.decode('utf-8')) if body else {}
        except json.JSONDecodeError:
            self._send_error_response('Invalid JSON', 400)
            return
        
        # 路由处理
        if parsed_path.path == '/api/huggingface/search':
            self._handle_huggingface_search(data)
        elif parsed_path.path == '/api/modelscope/search':
            self._handle_modelscope_search(data)
        else:
            self._send_error_response('Not Found', 404)
    
    def _handle_huggingface_search(self, data):
        """处理HuggingFace模型搜索"""
        if not HUGGINGFACE_AVAILABLE:
            self._send_error_response('HuggingFace Hub SDK not available', 503)
            return
        
        try:
            query = data.get('query', '')
            page = data.get('page', 1)
            page_size = data.get('page_size', 20)
            sort_by = data.get('sort_by', 'downloads')
            
            logger.info(f"HuggingFace search: query={query}, page={page}, page_size={page_size}")
            
            api = HfApi()
            
            # 搜索模型
            models = api.list_models(
                search=query,
                sort=sort_by,
                direction=-1,
                limit=page_size * page
            )
            
            # 转换为列表并分页
            model_list = list(models)
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_models = model_list[start_idx:end_idx]
            
            # 格式化结果
            results = []
            for model in paginated_models:
                results.append({
                    'id': model.modelId,
                    'name': model.modelId,
                    'downloads': getattr(model, 'downloads', 0),
                    'likes': getattr(model, 'likes', 0),
                    'tags': getattr(model, 'tags', []),
                    'created_at': getattr(model, 'created_at', None),
                    'last_modified': getattr(model, 'lastModified', None),
                })
            
            self._send_json_response({
                'success': True,
                'data': results,
                'total': len(model_list),
                'page': page,
                'page_size': page_size
            })
            
        except Exception as e:
            logger.error(f"HuggingFace search error: {str(e)}", exc_info=True)
            self._send_error_response(f'Search failed: {str(e)}')
    
    def _handle_modelscope_search(self, data):
        """处理ModelScope模型搜索"""
        if not MODELSCOPE_AVAILABLE:
            self._send_error_response('ModelScope SDK not available', 503)
            return
        
        try:
            query = data.get('query', '')
            page = data.get('page', 1)
            page_size = data.get('page_size', 20)
            
            logger.info(f"ModelScope search: query={query}, page={page}, page_size={page_size}")
            
            api = ModelScopeApi()
            
            # 搜索模型
            result = api.list_models(
                name_keyword=query,
                page_number=page,
                page_size=page_size
            )
            
            # 格式化结果
            models = result.get('Data', []) if isinstance(result, dict) else []
            
            results = []
            for model in models:
                results.append({
                    'id': model.get('ModelId', ''),
                    'name': model.get('Name', ''),
                    'downloads': model.get('Downloads', 0),
                    'likes': model.get('UsedCount', 0),
                    'tags': model.get('Tags', []),
                    'created_at': model.get('GmtCreate', None),
                    'last_modified': model.get('GmtModified', None),
                })
            
            total = result.get('TotalCount', len(results)) if isinstance(result, dict) else len(results)
            
            self._send_json_response({
                'success': True,
                'data': results,
                'total': total,
                'page': page,
                'page_size': page_size
            })
            
        except Exception as e:
            logger.error(f"ModelScope search error: {str(e)}", exc_info=True)
            self._send_error_response(f'Search failed: {str(e)}')
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        logger.info("%s - - [%s] %s" % (
            self.address_string(),
            self.log_date_time_string(),
            format % args
        ))


def run_server(port=8000):
    """运行服务器"""
    server_address = ('', port)
    httpd = HTTPServer(server_address, APIHandler)
    
    logger.info(f"Starting server on port {port}...")
    logger.info(f"ModelScope available: {MODELSCOPE_AVAILABLE}")
    logger.info(f"HuggingFace available: {HUGGINGFACE_AVAILABLE}")
    logger.info(f"Server running at http://localhost:{port}")
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        logger.info("\nShutting down server...")
        httpd.shutdown()


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
