import React, { useState } from 'react';
import { observer } from 'mobx-react-lite';
import { useTranslation } from 'react-i18next';
import { configStore } from './store';
import './style.css';

// ========== 类型定义 ==========

interface FieldProps {
    label: string;
    value: any;
    onChange: (value: any) => void;
    type?: 'text' | 'number' | 'checkbox' | 'select' | 'textarea';
    options?: { value: string; label: string }[];
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    help?: string;
    disabled?: boolean;
}

interface CardProps {
    title: string;
    children: React.ReactNode;
    defaultExpanded?: boolean;
    icon?: string;
}

// ========== 基础组件 ==========

const FormField: React.FC<FieldProps> = ({
    label,
    value,
    onChange,
    type = 'text',
    options = [],
    min,
    max,
    step,
    placeholder,
    help,
    disabled = false,
}) => {
    const renderInput = () => {
        switch (type) {
            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => onChange(e.target.checked)}
                        className="form-checkbox"
                        disabled={disabled}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) : e.target.value)}
                        min={min}
                        max={max}
                        step={step}
                        className="form-input"
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                );
            case 'select':
                return (
                    <select
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="form-select"
                        disabled={disabled}
                    >
                        {options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                );
            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="form-textarea"
                        placeholder={placeholder}
                        disabled={disabled}
                        rows={3}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="form-input"
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                );
        }
    };

    return (
        <div className="form-field">
            <label className="form-label">{label}</label>
            {renderInput()}
            {help && <small className="form-help">{help}</small>}
        </div>
    );
};

const ConfigCard: React.FC<CardProps> = ({ title, children, defaultExpanded = true, icon = '' }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);

    return (
        <div className="config-card">
            <div
                className="config-card-header"
                onClick={() => setIsExpanded(!isExpanded)}
            >
                <h3 className="config-card-title">{icon && <span className="card-icon">{icon}</span>}{title}</h3>
                <span className={`config-card-toggle ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </div>
            {isExpanded && <div className="config-card-body">{children}</div>}
        </div>
    );
};

// ========== ModelScope 搜索模态框组件 ==========

interface ModelScopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectModel: (model: any) => void;
}

// 格式化文件大小
const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return {{ t('search.modal.details.unknown') }};
    const gb = bytes / (1024 * 1024 * 1024);
    if (gb >= 1000) {
        return `${(gb / 1024).toFixed(1)}TB`;
    }
    if (gb >= 1) {
        return `${gb.toFixed(1)}GB`;
    }
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(0)}MB`;
};

// 格式化时间戳
const formatTime = (timestamp: number): string => {
    if (!timestamp || timestamp === 0) return {{ t('search.modal.details.unknown') }};
    // ModelScope 时间戳是秒级
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days < 1) return '今天';
    if (days < 7) return `${days}天前`;
    if (days < 30) return `${Math.floor(days / 7)}周前`;
    if (days < 365) return `${Math.floor(days / 30)}月前`;
    return date.getFullYear().toString();
};

const ModelScopeModal: React.FC<ModelScopeModalProps> = observer(({ isOpen, onClose, onSelectModel }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updated'); // 默认按时间排序

    const handleSearch = async () => {
        if (searchQuery.trim()) {
            await configStore.searchModelscope(searchQuery, 1, 20, sortBy);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        if (configStore.modelscopeSearchQuery) {
            configStore.searchModelscope(configStore.modelscopeSearchQuery, 1, 20, newSortBy);
        }
    };

    const handleSelectModel = (model: any) => {
        onSelectModel(model);
        onClose();
    };

    // 分页组件
    const Pagination = () => (
        configStore.modelscopeTotalPages > 1 && (
            <div className="modal-pagination">
                <span className="pagination-info">
                    第 {configStore.modelscopePage} / {configStore.modelscopeTotalPages} 页
                    {configStore.modelscopeTotal > 0 && ` (共 ${configStore.modelscopeTotal} 个模型)`}
                </span>
                <div className="pagination-buttons">
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => configStore.prevModelscopePage()}
                        disabled={configStore.modelscopePage <= 1}
                    >
                        ← 上一页
                    </button>
                    <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => configStore.nextModelscopePage()}
                        disabled={configStore.modelscopePage >= configStore.modelscopeTotalPages}
                    >
                        下一页 →
                    </button>
                </div>
            </div>
        )
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>🔍 {t('search.modal.title')}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>

                <div className="modal-search-box">
                    <input
                        type="text"
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={t('search.modal.placeholder')}
                        autoFocus
                    />
                    <button
                        className="btn btn-primary btn-search-submit"
                        onClick={handleSearch}
                        disabled={configStore.modelscopeLoading}
                    >
                        {configStore.modelscopeLoading ? t('search.modal.searching') : t('search.modal.search')}
                    </button>
                </div>

                {configStore.modelscopeSearchResults.length > 0 && (
                    <>
                        {/* 顶部分页 */}
                        <Pagination />

                        <div className="modal-sort">
                            <span className="sort-label">排序方式:</span>
                            <div className="sort-buttons">
                                <button
                                    className={`sort-btn ${sortBy === 'downloads' ? 'active' : ''}`}
                                    onClick={() => handleSortChange('downloads')}
                                >
                                    📥 下载量
                                </button>
                                <button
                                    className={`sort-btn ${sortBy === 'likes' ? 'active' : ''}`}
                                    onClick={() => handleSortChange('likes')}
                                >
                                    ❤️ 点赞数
                                </button>
                                <button
                                    className={`sort-btn ${sortBy === 'updated' ? 'active' : ''}`}
                                    onClick={() => handleSortChange('updated')}
                                >
                                    🕐 更新时间
                                </button>
                                <button
                                    className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`}
                                    onClick={() => handleSortChange('name')}
                                >
                                    🔤 名称
                                </button>
                            </div>
                        </div>

                        <div className="modal-results">
                            {configStore.modelscopeSearchResults.map((model: any, index: number) => (
                                <div
                                    key={index}
                                    className="modal-result-item"
                                    onClick={() => handleSelectModel(model)}
                                >
                                    <div className="result-header">
                                        <span className="result-model-id">{model.model_id}</span>
                                        <span className="result-task">{model.task}</span>
                                        <a
                                            href={`https://modelscope.cn/models/${model.model_id}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="result-link"
                                            onClick={(e) => e.stopPropagation()}
                                            title="在 ModelScope 查看模型"
                                        >
                                            🔗 查看
                                        </a>
                                    </div>
                                    
                                    <div className="result-details">
                                        <div className="detail-row">
                                            <span className="detail-label">参数量:</span>
                                            <span className="detail-value">{model.parameters || {{ t('search.modal.details.unknown') }}}</span>
                                            <span className="detail-label">精度:</span>
                                            <span className="detail-value">{model.dtype || {{ t('search.modal.details.auto') }}}</span>
                                            <span className="detail-label">权重:</span>
                                            <span className="detail-value">{formatSize(model.size)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">框架:</span>
                                            <span className="detail-value">{model.framework}</span>
                                            <span className="detail-label">许可:</span>
                                            <span className="detail-value">{model.license || {{ t('search.modal.details.unknown') }}}</span>
                                            <span className="detail-label">发布:</span>
                                            <span className="detail-value">{formatTime(model.updated)}</span>
                                        </div>
                                    </div>
                                    
                                    {model.description && model.description.trim() ? (
                                        <div className="result-description">{model.description}</div>
                                    ) : null}
                                    
                                    <div className="result-meta">
                                        <span>📥 {model.downloads?.toLocaleString() || 0}</span>
                                        <span>❤️ {model.likes?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 底部分页 */}
                        <Pagination />
                    </>
                )}

                {configStore.modelscopeSearchQuery && configStore.modelscopeSearchResults.length === 0 && !configStore.modelscopeLoading && (
                    <div className="search-empty">未找到相关模型</div>
                )}
            </div>
        </div>
    );
});

// ========== 主应用组件 ==========

export const App: React.FC = observer(() => {
    const { t, i18n } = useTranslation();
    const [importText, setImportText] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'yaml' | 'cli' | 'env'>('yaml');
    const [showModelScopeModal, setShowModelScopeModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showQuantModal, setShowQuantModal] = useState(false);
    const [showMultiNodeAlert, setShowMultiNodeAlert] = useState(false);
    const [pendingModelId, setPendingModelId] = useState<string>('');

    const changeLanguage = (lng: string) => {
        i18n.changeLanguage(lng);
    };

    const downloadYaml = () => {
        const yamlContent = configStore.yamlConfig;
        const blob = new Blob([yamlContent], { type: 'text/yaml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'vllm-config.yaml';
        a.click();
        URL.revokeObjectURL(url);
    };

    const copyYaml = async () => {
        try {
            await navigator.clipboard.writeText(configStore.yamlConfig);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    const copyCommandLine = async () => {
        try {
            await navigator.clipboard.writeText(configStore.commandLineArgs);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('复制失败:', err);
        }
    };

    const handleImport = () => {
        if (configStore.importYaml(importText)) {
            setImportText('');
            setShowImportModal(false);
            alert({{ t('preview.import.success') }});
        } else {
            alert({{ t('preview.import.error') }});
        }
    };

    const getPreviewContent = () => {
        switch (activeTab) {
            case 'cli':
                return <code>{configStore.commandLineArgs}</code>;
            case 'env':
                const envVars = configStore.environmentVariables;
                if (Object.keys(envVars).length === 0) {
                    return <code className="empty">没有自定义环境变量</code>;
                }
                return (
                    <code>
                        {Object.entries(envVars).map(([key, value]) => (
                            <div key={key}>export {key}="{value}"</div>
                        ))}
                    </code>
                );
            default:
                return <code>{configStore.yamlConfig}</code>;
        }
    };

    return (
        <div className="app-container">
            {/* 顶部区域：标题 + 显存状态 */}
            <div className="app-top-bar">
                <header className="app-header">
                    <div className="header-content">
                        <div className="header-title">
                            <h1>🚀 {t('app.title')}</h1>
                        </div>
                        <div className="header-actions">
                            <div className="language-switcher">
                                <button
                                    className={`lang-btn ${i18n.language === 'zh' ? 'active' : ''}`}
                                    onClick={() => changeLanguage('zh')}
                                >
                                    中文
                                </button>
                                <button
                                    className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`}
                                    onClick={() => changeLanguage('en')}
                                >
                                    EN
                                </button>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 显存占用和设备兼容性显示 */}
                <div className="vram-status-bar">
                    <div className="vram-info">
                        <span className="vram-label">📊 显存占用</span>
                        <div className="vram-bar-single">
                            {/* 64GB 标记线 */}
                            <div className="vram-bar-marker" style={{ left: '50%' }} title="64GB"></div>
                            {/* 进度条 */}
                            <div className="vram-bar-fill-container">
                                {/* 模型权重部分 - 可点击选择量化 */}
                                <div 
                                    className="vram-bar-fill-model clickable"
                                    style={{ 
                                        width: `${(configStore.vramUsage.model / 1.28).toFixed(1)}%` 
                                    }}
                                    title={`模型权重：${configStore.vramUsage.model}GB`}
                                    onClick={() => setShowQuantModal(true)}
                                ></div>
                                {/* KV 缓存部分 */}
                                <div 
                                    className="vram-bar-fill-kv"
                                    style={{ 
                                        width: `${(configStore.vramUsage.kvCache / 1.28).toFixed(1)}%` 
                                    }}
                                    title={`KV 缓存：${configStore.vramUsage.kvCache}GB`}
                                ></div>
                                {/* 总值标签 */}
                                <div className="vram-bar-value-overlay">
                                    {configStore.vramUsage.total > 0 ? `${configStore.vramUsage.total}GB` : '-'}
                                    {configStore.vramUsage.total > 128 && (
                                        <span className="vram-overflow-warning"> ⚠️ 超限</span>
                                    )}
                                </div>
                            </div>
                            {/* 刻度标签 */}
                            <div className="vram-bar-labels">
                                <span>0GB</span>
                                <span>64GB</span>
                                <span>128GB</span>
                            </div>
                            {/* 图例 */}
                            <div className="vram-bar-legend">
                                <span className="legend-item">
                                    <span className="legend-color legend-model"></span>
                                    模型权重 ({configStore.vramUsage.model > 0 ? `${configStore.vramUsage.model}GB` : '-'})
                                    {configStore.quantizationMode !== 'auto' && (
                                        <span className="legend-quant-hint">
                                            {' '} (原始：{(configStore.vramUsage.model * (2 / configStore.getBytesPerParam())).toFixed(1)}GB → 量化后：{configStore.vramUsage.model}GB)
                                        </span>
                                    )}
                                    {/* 量化提示 - 内联显示 */}
                                    {configStore.quantizationMode !== 'auto' && (
                                        <span className="legend-quant-notice">
                                            {' '} ⚠️ 请确保已下载量化权重或自行量化
                                        </span>
                                    )}
                                </span>
                                <span className="legend-item">
                                    <span className="legend-color legend-kv"></span>
                                    KV 缓存 ({configStore.vramUsage.kvCache > 0 ? `${configStore.vramUsage.kvCache}GB` : '-'})
                                </span>
                                {/* 上下文长度选择 */}
                                <div className="vram-context-select">
                                    <span className="context-select-label">📝 上下文</span>
                                    <select
                                        className="context-select"
                                        value={configStore.maxModelLen}
                                        onChange={(e) => {
                                            configStore.maxModelLen = parseInt(e.target.value);
                                        }}
                                        title={configStore.modelMaxPositionEmbeddings > 0 
                                            ? `模型最大上下文：${configStore.modelMaxPositionEmbeddings}` 
                                            : "选择上下文长度"}
                                    >
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 512 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={512}>512</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 1024 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={1024}>1K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 2048 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={2048}>2K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 4096 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={4096}>4K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 8192 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={8192}>8K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 16384 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={16384}>16K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 32768 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={32768}>32K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 65536 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={65536}>64K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 131072 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={131072}>128K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 262144 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={262144}>256K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 524288 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={524288}>512K</option>
                                        ) : null}
                                        {configStore.modelMaxPositionEmbeddings <= 0 || 1048576 <= configStore.modelMaxPositionEmbeddings ? (
                                            <option value={1048576}>1M</option>
                                        ) : null}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="vram-devices">
                        <span className="vram-label">🖥️ 设备兼容性</span>
                        <div className="device-list">
                            {configStore.deviceCompatibility.map((item, index) => (
                                <div key={index} className={`device-item ${item.compatible ? 'compatible' : 'incompatible'}`}>
                                    <span className="device-name">{item.device}</span>
                                    <span className="device-status">
                                        {item.compatible ? {{ t('vram.deployable') }} : {{ t('vram.notDeployable') }}}
                                        {item.compatible && <span className="device-available"> (剩余 {item.available.toFixed(1)}GB)</span>}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <main className="app-main app-main-fixed">
                {/* 左侧 - 配置预览（固定显示） */}
                <aside className="yaml-preview yaml-preview-fixed-left">
                    <div className="preview-header">
                        <h2>📄 配置预览</h2>
                        <button 
                            className="btn btn-sm btn-info modal-trigger-btn"
                            onClick={() => setShowModelScopeModal(true)}
                        >
                            🔍 搜索模型
                        </button>
                    </div>
                    <div className="preview-tabs">
                        <button
                            className={`preview-tab ${activeTab === 'yaml' ? 'active' : ''}`}
                            onClick={() => setActiveTab('yaml')}
                        >
                            YAML
                        </button>
                        <button
                            className={`preview-tab ${activeTab === 'cli' ? 'active' : ''}`}
                            onClick={() => setActiveTab('cli')}
                        >
                            命令行
                        </button>
                        <button
                            className={`preview-tab ${activeTab === 'env' ? 'active' : ''}`}
                            onClick={() => setActiveTab('env')}
                        >
                            环境变量
                        </button>
                    </div>

                    <div className="yaml-content">
                        {getPreviewContent()}
                    </div>

                    <div className="preview-actions-group">
                        <div className="action-row">
                            <button className="btn btn-primary btn-block" onClick={downloadYaml} title="下载 YAML 配置文件">
                                ⬇️ 下载 YAML
                            </button>
                            <button className="btn btn-success btn-block" onClick={copyYaml} title="复制 YAML 配置到剪贴板">
                                📋 复制 YAML
                            </button>
                            <button className="btn btn-secondary btn-block" onClick={() => { setActiveTab('cli'); copyCommandLine(); }} title="复制 vLLM 启动命令">
                                📄 复制命令行
                            </button>
                            <button className="btn btn-danger btn-block" onClick={() => configStore.reset()} title="重置所有配置为默认值">
                                🗑️ 重置
                            </button>
                            <button className="btn btn-secondary btn-block" onClick={() => setShowImportModal(true)} title="从 YAML 导入配置">
                                📥 导入
                            </button>
                        </div>
                    </div>
                </aside>

                {/* 右侧 - 配置表单 */}
                <div className="config-form config-form-right">
                    {/* 一、核心模型参数 */}
                    <ConfigCard title={{ t('config.model.title') }} icon="📦" defaultExpanded={false}>
                        <FormField
                            label="模型名称 (model)"
                            value={configStore.model}
                            onChange={(v) => (configStore.model = v)}
                            placeholder="例如：Qwen/Qwen2.5-7B-Instruct"
                            help="HuggingFace 或 ModelScope 模型路径"
                        />
                        <div className="form-row">
                            <FormField
                                label="分词器 (tokenizer)"
                                value={configStore.tokenizer}
                                onChange={(v) => (configStore.tokenizer = v)}
                                placeholder="留空则使用模型自带的分词器"
                            />
                            <FormField
                                label="数据类型 (dtype)"
                                value={configStore.dtype}
                                onChange={(v) => (configStore.dtype = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'half', label: 'half' },
                                    { value: 'float16', label: 'float16' },
                                    { value: 'bfloat16', label: 'bfloat16' },
                                    { value: 'float', label: 'float' },
                                    { value: 'float32', label: 'float32' },
                                ]}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="最大模型长度 (max-model-len)"
                                value={configStore.maxModelLen}
                                onChange={(v) => {
                                    // 如果超过模型限制，提示用户
                                    if (configStore.modelConfigLoaded && v > configStore.modelMaxPositionEmbeddings) {
                                        if (window.confirm(`⚠️ 警告：设置的值 (${v}) 超过了模型最大上下文 (${configStore.modelMaxPositionEmbeddings})\n\n继续设置可能导致模型截断或错误。\n\n是否继续？`)) {
                                            configStore.maxModelLen = v;
                                        } else {
                                            // 恢复为模型最大值
                                            configStore.maxModelLen = configStore.modelMaxPositionEmbeddings;
                                        }
                                    } else {
                                        configStore.maxModelLen = v;
                                    }
                                }}
                                type="number"
                                min={512}
                                step={512}
                                help={configStore.modelConfigLoaded ? `模型最大上下文：${configStore.modelMaxPositionEmbeddings} (硬约束)` : '模型处理的最大序列长度'}
                            />
                            <FormField
                                label="加载格式 (load-format)"
                                value={configStore.loadFormat}
                                onChange={(v) => (configStore.loadFormat = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'pt', label: 'PyTorch (.pt)' },
                                    { value: 'safetensors', label: 'Safetensors' },
                                    { value: 'npcache', label: 'NumPy Cache' },
                                    { value: 'dummy', label: '虚拟加载 (dummy)' },
                                    { value: 'tensorizer', label: 'Tensorizer' },
                                    { value: 'sharded_state', label: '分片 State' },
                                    { value: 'gguf', label: 'GGUF' },
                                    { value: 'bitsandbytes', label: 'BitsAndBytes' },
                                ]}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="分词器模式 (tokenizer-mode)"
                                value={configStore.tokenizerMode}
                                onChange={(v) => (configStore.tokenizerMode = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'slow', label: '慢速 (slow)' },
                                ]}
                            />
                            <FormField
                                label="引导解码后端 (guided-decoding-backend)"
                                value={configStore.guidedDecodingBackend}
                                onChange={(v) => (configStore.guidedDecodingBackend = v)}
                                type="select"
                                options={[
                                    { value: 'outlines', label: 'Outlines' },
                                    { value: 'lm-format-enforcer', label: 'LM Format Enforcer' },
                                ]}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="修订版本 (revision)"
                                value={configStore.revision}
                                onChange={(v) => (configStore.revision = v)}
                                placeholder="master"
                            />
                            <FormField
                                label="下载目录 (download-dir)"
                                value={configStore.downloadDir}
                                onChange={(v) => (configStore.downloadDir = v)}
                                placeholder="留空使用 HF 默认缓存目录"
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="信任远程代码 (trust-remote-code)"
                                value={configStore.trustRemoteCode}
                                onChange={(v) => (configStore.trustRemoteCode = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="跳过分词器初始化 (skip-tokenizer-init)"
                                value={configStore.skipTokenizerInit}
                                onChange={(v) => (configStore.skipTokenizerInit = v)}
                                type="checkbox"
                            />
                        </div>
                    </ConfigCard>

                    {/* 二、分布式与并行配置 */}
                    <ConfigCard title={{ t('config.distributed.title') }} icon="⚡" defaultExpanded={false}>
                        <div className="form-row">
                            <FormField
                                label="张量并行数 (tensor-parallel-size)"
                                value={configStore.tensorParallelSize}
                                onChange={(v) => (configStore.tensorParallelSize = v)}
                                type="number"
                                min={1}
                                max={64}
                                help="用于张量并行的 GPU 数量 (-tp)"
                            />
                            <FormField
                                label="流水线并行数 (pipeline-parallel-size)"
                                value={configStore.pipelineParallelSize}
                                onChange={(v) => (configStore.pipelineParallelSize = v)}
                                type="number"
                                min={1}
                                max={64}
                                help="用于流水线并行的 GPU 数量 (-pp)"
                            />
                        </div>
                        <FormField
                            label="分布式执行后端 (distributed-executor-backend)"
                            value={configStore.distributedExecutorBackend}
                            onChange={(v) => (configStore.distributedExecutorBackend = v)}
                            type="select"
                            options={[
                                { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                { value: 'ray', label: 'Ray' },
                                { value: 'mp', label: '多进程 (mp)' },
                            ]}
                            help="分布式服务后端"
                        />
                        <div className="form-row">
                            <FormField
                                label="使用 Ray (worker-use-ray)"
                                value={configStore.workerUseRay}
                                onChange={(v) => (configStore.workerUseRay = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="Ray Worker Nsight (ray-workers-use-nsight)"
                                value={configStore.rayWorkersUseNsight}
                                onChange={(v) => (configStore.rayWorkersUseNsight = v)}
                                type="checkbox"
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="禁用自定义 AllReduce (disable-custom-all-reduce)"
                                value={configStore.disableCustomAllReduce}
                                onChange={(v) => (configStore.disableCustomAllReduce = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="最大并行加载 Worker 数"
                                value={configStore.maxParallelLoadingWorkers}
                                onChange={(v) => (configStore.maxParallelLoadingWorkers = v)}
                                type="number"
                                min={0}
                                placeholder="0 为自动"
                            />
                        </div>
                    </ConfigCard>

                    {/* 三、内存与缓存配置 */}
                    <ConfigCard title={{ t('config.memory.title') }} icon="💾" defaultExpanded={false}>
                        <FormField
                            label="GPU 内存利用率 (gpu-memory-utilization)"
                            value={configStore.gpuMemoryUtilization}
                            onChange={(v) => (configStore.gpuMemoryUtilization = v)}
                            type="number"
                            min={0.1}
                            max={1}
                            step={0.05}
                            help="用于 KV 缓存的 GPU 内存比例 (0.1-1.0)"
                        />
                        <div className="form-row">
                            <FormField
                                label="块大小 (block-size)"
                                value={configStore.blockSize}
                                onChange={(v) => (configStore.blockSize = v)}
                                type="number"
                                min={8}
                                max={2048}
                                step={8}
                                help="连续 token 块大小：8/16/32/128/256/512/1024/2048"
                            />
                            <FormField
                                label="KV 缓存数据类型 (kv-cache-dtype)"
                                value={configStore.kvCacheDtype}
                                onChange={(v) => (configStore.kvCacheDtype = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'fp8', label: 'FP8' },
                                    { value: 'fp8_e5m2', label: 'FP8 E5M2' },
                                    { value: 'fp8_e4m3', label: 'FP8 E4M3' },
                                ]}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="交换空间 (swap-space)"
                                value={configStore.swapSpace}
                                onChange={(v) => (configStore.swapSpace = v)}
                                type="number"
                                min={0}
                                max={64}
                                help="每 GPU 的 CPU 交换空间大小 (GiB)"
                            />
                            <FormField
                                label="CPU 卸载空间 (cpu-offload-gb)"
                                value={configStore.cpuOffloadGb}
                                onChange={(v) => (configStore.cpuOffloadGb = v)}
                                type="number"
                                min={0}
                                max={64}
                                help="每 GPU 卸载到 CPU 的空间 (GiB)"
                            />
                        </div>
                        <FormField
                            label="GPU Blocks 覆盖值 (num-gpu-blocks-override)"
                            value={configStore.numGpuBlocksOverride || ''}
                            onChange={(v) =>
                                (configStore.numGpuBlocksOverride = v ? parseInt(v) : undefined)
                            }
                            type="number"
                            min={1}
                            placeholder="留空使用自动计算"
                        />
                        <div className="form-row">
                            <FormField
                                label="启用前缀缓存 (enable-prefix-caching)"
                                value={configStore.enablePrefixCaching}
                                onChange={(v) => (configStore.enablePrefixCaching = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="禁用滑动窗口 (disable-sliding-window)"
                                value={configStore.disableSlidingWindow}
                                onChange={(v) => (configStore.disableSlidingWindow = v)}
                                type="checkbox"
                            />
                        </div>
                    </ConfigCard>

                    {/* 四、调度与批处理配置 */}
                    <ConfigCard title={{ t('config.scheduler.title') }} icon="📋" defaultExpanded={false}>
                        <FormField
                            label="最大序列数 (max-num-seqs)"
                            value={configStore.maxNumSeqs}
                            onChange={(v) => (configStore.maxNumSeqs = v)}
                            type="number"
                            min={1}
                            max={1024}
                            help="每次迭代的最大序列数量"
                        />
                        <FormField
                            label="最大批处理 Token 数 (max-num-batched-tokens)"
                            value={configStore.maxNumBatchedTokens || ''}
                            onChange={(v) =>
                                (configStore.maxNumBatchedTokens = v ? parseInt(v) : undefined)
                            }
                            type="number"
                            min={1}
                            placeholder="留空使用默认值"
                        />
                        <div className="form-row">
                            <FormField
                                label="调度器步数 (num-scheduler-steps)"
                                value={configStore.numSchedulerSteps}
                                onChange={(v) => (configStore.numSchedulerSteps = v)}
                                type="number"
                                min={1}
                                max={10}
                            />
                            <FormField
                                label="调度延迟因子 (scheduler-delay-factor)"
                                value={configStore.schedulerDelayFactor}
                                onChange={(v) => (configStore.schedulerDelayFactor = v)}
                                type="number"
                                min={0}
                                max={1}
                                step={0.1}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="启用分块预填充 (enable-chunked-prefill)"
                                value={configStore.enableChunkedPrefill}
                                onChange={(v) => (configStore.enableChunkedPrefill = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="抢占模式 (preemption-mode)"
                                value={configStore.preemptionMode}
                                onChange={(v) => (configStore.preemptionMode = v)}
                                type="select"
                                options={[
                                    { value: '', label: {{ t('search.modal.details.auto') }} },
                                    { value: 'recompute', label: '重计算 (recompute)' },
                                    { value: 'swap', label: '交换 (swap)' },
                                ]}
                            />
                        </div>
                    </ConfigCard>

                    {/* 五、量化配置 */}
                    <ConfigCard title={{ t('config.quantization.title') }} icon="🔧" defaultExpanded={false}>
                        <FormField
                            label="量化方法 (quantization)"
                            value={configStore.quantization}
                            onChange={(v) => (configStore.quantization = v)}
                            type="select"
                            options={[
                                { value: '', label: '无' },
                                { value: 'aqlm', label: 'AQLM' },
                                { value: 'awq', label: 'AWQ' },
                                { value: 'deepspeedfp', label: 'DeepSpeed FP' },
                                { value: 'tpu_int8', label: 'TPU INT8' },
                                { value: 'fp8', label: 'FP8' },
                                { value: 'fbgemm_fp8', label: 'FBGEMM FP8' },
                                { value: 'marlin', label: 'Marlin' },
                                { value: 'gguf', label: 'GGUF' },
                                { value: 'gptq_marlin_24', label: 'GPTQ Marlin 24' },
                                { value: 'gptq_marlin', label: 'GPTQ Marlin' },
                                { value: 'awq_marlin', label: 'AWQ Marlin' },
                                { value: 'gptq', label: 'GPTQ' },
                                { value: 'squeezellm', label: 'SqueezeLLM' },
                                { value: 'compressed-tensors', label: 'Compressed Tensors' },
                                { value: 'bitsandbytes', label: 'BitsAndBytes' },
                                { value: 'qqq', label: 'QQQ' },
                                { value: 'experts_int8', label: 'Experts INT8' },
                            ]}
                            help="选择量化方法以减少显存占用"
                        />
                        <FormField
                            label="量化参数路径 (quantization-param-path)"
                            value={configStore.quantizationParamPath}
                            onChange={(v) => (configStore.quantizationParamPath = v)}
                            placeholder="/path/to/quant-params.json"
                            help="FP8 量化时需要提供缩放因子 JSON 文件"
                        />
                        <FormField
                            label="推测模型量化 (speculative-model-quantization)"
                            value={configStore.speculativeModelQuantization}
                            onChange={(v) => (configStore.speculativeModelQuantization = v)}
                            type="select"
                            options={[
                                { value: '', label: '无' },
                                { value: 'awq', label: 'AWQ' },
                                { value: 'gptq', label: 'GPTQ' },
                                { value: 'fp8', label: 'FP8' },
                            ]}
                        />
                    </ConfigCard>

                    {/* 六、RoPE 与性能优化 */}
                    <ConfigCard title={{ t('config.rope.title') }} icon="⚙️" defaultExpanded={false}>
                        <div className="form-row">
                            <FormField
                                label="RoPE Theta (rope-theta)"
                                value={configStore.ropeTheta}
                                onChange={(v) => (configStore.ropeTheta = v)}
                                type="number"
                                min={0}
                                step={1000}
                                placeholder="默认由模型决定"
                            />
                            <FormField
                                label="最大捕获序列长度 (max-seq-len-to-capture)"
                                value={configStore.maxSeqLenToCapture}
                                onChange={(v) => (configStore.maxSeqLenToCapture = v)}
                                type="number"
                                min={1024}
                                step={1024}
                            />
                        </div>
                        <FormField
                            label="RoPE 缩放配置 (rope-scaling)"
                            value={configStore.ropeScaling}
                            onChange={(v) => (configStore.ropeScaling = v)}
                            type="textarea"
                            placeholder='例如：{"type":"dynamic","factor":2.0}'
                            help="JSON 格式配置 RoPE 缩放"
                        />
                        <div className="form-row">
                            <FormField
                                label="强制 Eager 模式 (enforce-eager)"
                                value={configStore.enforceEager}
                                onChange={(v) => (configStore.enforceEager = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="使用 V2 Block Manager (use-v2-block-manager)"
                                value={configStore.useV2BlockManager}
                                onChange={(v) => (configStore.useV2BlockManager = v)}
                                type="checkbox"
                            />
                        </div>
                    </ConfigCard>

                    {/* 七、Tokenizer 池化 */}
                    <ConfigCard title={{ t('config.tokenizerPool.title') }} icon="🔄" defaultExpanded={false}>
                        <FormField
                            label="Tokenizer 池大小 (tokenizer-pool-size)"
                            value={configStore.tokenizerPoolSize}
                            onChange={(v) => (configStore.tokenizerPoolSize = v)}
                            type="number"
                            min={0}
                            max={32}
                            help="0 表示同步分词"
                        />
                        <div className="form-row">
                            <FormField
                                label="池类型 (tokenizer-pool-type)"
                                value={configStore.tokenizerPoolType}
                                onChange={(v) => (configStore.tokenizerPoolType = v)}
                                type="select"
                                options={[
                                    { value: 'ray', label: 'Ray' },
                                    { value: 'mp', label: '多进程' },
                                ]}
                            />
                            <FormField
                                label="额外配置 (tokenizer-pool-extra-config)"
                                value={configStore.tokenizerPoolExtraConfig}
                                onChange={(v) => (configStore.tokenizerPoolExtraConfig = v)}
                                placeholder="JSON 格式配置"
                            />
                        </div>
                    </ConfigCard>

                    {/* 八、多模态配置 */}
                    <ConfigCard title={{ t('config.multimodal.title') }} icon="🖼️" defaultExpanded={false}>
                        <FormField
                            label="限制每 Prompt 多模态输入 (limit-mm-per-prompt)"
                            value={configStore.limitMmPerPrompt}
                            onChange={(v) => (configStore.limitMmPerPrompt = v)}
                            placeholder="例如：image=16,video=2"
                            help="限制每个提示的多模态输入数量"
                        />
                    </ConfigCard>

                    {/* 九、LoRA 适配器配置 */}
                    <ConfigCard title={{ t('config.lora.title') }} icon="🔌" defaultExpanded={false}>
                        <div className="form-row">
                            <FormField
                                label="启用 LoRA (enable-lora)"
                                value={configStore.enableLora}
                                onChange={(v) => (configStore.enableLora = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="完全分片 LoRA (fully-sharded-loras)"
                                value={configStore.fullyShardedLoras}
                                onChange={(v) => (configStore.fullyShardedLoras = v)}
                                type="checkbox"
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="最大 LoRA 数 (max-loras)"
                                value={configStore.maxLoras}
                                onChange={(v) => (configStore.maxLoras = v)}
                                type="number"
                                min={1}
                                max={100}
                            />
                            <FormField
                                label="最大 LoRA 秩 (max-lora-rank)"
                                value={configStore.maxLoraRank}
                                onChange={(v) => (configStore.maxLoraRank = v)}
                                type="number"
                                min={1}
                                max={256}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="LoRA 额外词汇大小 (lora-extra-vocab-size)"
                                value={configStore.loraExtraVocabSize}
                                onChange={(v) => (configStore.loraExtraVocabSize = v)}
                                type="number"
                                min={0}
                            />
                            <FormField
                                label="LoRA 数据类型 (lora-dtype)"
                                value={configStore.loraDtype}
                                onChange={(v) => (configStore.loraDtype = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'float16', label: 'float16' },
                                    { value: 'bfloat16', label: 'bfloat16' },
                                    { value: 'float32', label: 'float32' },
                                ]}
                            />
                        </div>
                        <FormField
                            label="长 LoRA 缩放因子 (long-lora-scaling-factors)"
                            value={configStore.longLoraScalingFactors}
                            onChange={(v) => (configStore.longLoraScalingFactors = v)}
                            placeholder="例如：1.0,2.0,4.0"
                        />
                        <div className="form-row">
                            <FormField
                                label="最大 CPU LoRA 数 (max-cpu-loras)"
                                value={configStore.maxCpuLoras || ''}
                                onChange={(v) =>
                                    (configStore.maxCpuLoras = v ? parseInt(v) : undefined)
                                }
                                type="number"
                                min={1}
                            />
                            <FormField
                                label="QLoRA 适配器路径 (qlora-adapter-name-or-path)"
                                value={configStore.qloraAdapterNameOrPath}
                                onChange={(v) => (configStore.qloraAdapterNameOrPath = v)}
                                placeholder="适配器名称或路径"
                            />
                        </div>
                    </ConfigCard>

                    {/* 十、Prompt Adapter 配置 */}
                    <ConfigCard title={{ t('config.promptAdapter.title') }} icon="📝" defaultExpanded={false}>
                        <FormField
                            label="启用 Prompt Adapter (enable-prompt-adapter)"
                            value={configStore.enablePromptAdapter}
                            onChange={(v) => (configStore.enablePromptAdapter = v)}
                            type="checkbox"
                        />
                        <div className="form-row">
                            <FormField
                                label="最大 Prompt Adapter 数 (max-prompt-adapters)"
                                value={configStore.maxPromptAdapters}
                                onChange={(v) => (configStore.maxPromptAdapters = v)}
                                type="number"
                                min={1}
                            />
                            <FormField
                                label="最大 Prompt Adapter Token (max-prompt-adapter-token)"
                                value={configStore.maxPromptAdapterToken}
                                onChange={(v) => (configStore.maxPromptAdapterToken = v)}
                                type="number"
                                min={0}
                            />
                        </div>
                    </ConfigCard>

                    {/* 十一、推测解码配置 */}
                    <ConfigCard title={{ t('config.speculative.title') }} icon="🔮" defaultExpanded={false}>
                        <FormField
                            label="推测模型 (speculative-model)"
                            value={configStore.speculativeModel}
                            onChange={(v) => (configStore.speculativeModel = v)}
                            placeholder="草稿模型名称或路径"
                        />
                        <FormField
                            label="推测 Token 数 (num-speculative-tokens)"
                            value={configStore.numSpeculativeTokens}
                            onChange={(v) => (configStore.numSpeculativeTokens = v)}
                            type="number"
                            min={0}
                            max={10}
                        />
                        <div className="form-row">
                            <FormField
                                label="推测最大模型长度 (speculative-max-model-len)"
                                value={configStore.speculativeMaxModelLen || ''}
                                onChange={(v) =>
                                    (configStore.speculativeMaxModelLen = v ? parseInt(v) : undefined)
                                }
                                type="number"
                                min={512}
                            />
                            <FormField
                                label="按批量大小禁用阈值 (speculative-disable-by-batch-size)"
                                value={configStore.speculativeDisableByBatchSize || ''}
                                onChange={(v) =>
                                    (configStore.speculativeDisableByBatchSize = v ? parseInt(v) : undefined)
                                }
                                type="number"
                                min={0}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="Ngram 查找最大值 (ngram-prompt-lookup-max)"
                                value={configStore.ngramPromptLookupMax}
                                onChange={(v) => (configStore.ngramPromptLookupMax = v)}
                                type="number"
                                min={0}
                            />
                            <FormField
                                label="Ngram 查找最小值 (ngram-prompt-lookup-min)"
                                value={configStore.ngramPromptLookupMin}
                                onChange={(v) => (configStore.ngramPromptLookupMin = v)}
                                type="number"
                                min={0}
                            />
                        </div>
                        <FormField
                            label="推测接受方法 (spec-decoding-acceptance-method)"
                            value={configStore.specDecodingAcceptanceMethod}
                            onChange={(v) => (configStore.specDecodingAcceptanceMethod = v)}
                            type="select"
                            options={[
                                { value: 'rejection_sampler', label: '拒绝采样 (rejection_sampler)' },
                                { value: 'typical_acceptance_sampler', label: '典型接受采样 (typical_acceptance_sampler)' },
                            ]}
                        />
                        <div className="form-row">
                            <FormField
                                label="后验概率阈值 (typical-acceptance-sampler-posterior-threshold)"
                                value={configStore.typicalAcceptanceSamplerPosteriorThreshold}
                                onChange={(v) => (configStore.typicalAcceptanceSamplerPosteriorThreshold = v)}
                                type="number"
                                min={0}
                                max={1}
                                step={0.01}
                            />
                            <FormField
                                label="熵阈值缩放因子 (typical-acceptance-sampler-posterior-alpha)"
                                value={configStore.typicalAcceptanceSamplerPosteriorAlpha}
                                onChange={(v) => (configStore.typicalAcceptanceSamplerPosteriorAlpha = v)}
                                type="number"
                                min={0}
                                max={1}
                                step={0.1}
                            />
                        </div>
                        <FormField
                            label="禁用推测 logprobs (disable-logprobs-during-spec-decoding)"
                            value={configStore.disableLogprobsDuringSpecDecoding}
                            onChange={(v) => (configStore.disableLogprobsDuringSpecDecoding = v)}
                            type="checkbox"
                        />
                    </ConfigCard>

                    {/* 十二、日志与监控配置 */}
                    <ConfigCard title={{ t('config.logging.title') }} icon="📊" defaultExpanded={false}>
                        <div className="form-row">
                            <FormField
                                label="禁用统计日志 (disable-log-stats)"
                                value={configStore.disableLogStats}
                                onChange={(v) => (configStore.disableLogStats = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="禁用请求日志 (disable-log-requests)"
                                value={configStore.disableLogRequests}
                                onChange={(v) => (configStore.disableLogRequests = v)}
                                type="checkbox"
                            />
                        </div>
                        <FormField
                            label="最大 logprobs (max-logprobs)"
                            value={configStore.maxLogprobs}
                            onChange={(v) => (configStore.maxLogprobs = v)}
                            type="number"
                            min={1}
                            max={100}
                        />
                        <FormField
                            label="OTLP Traces 端点 (otlp-traces-endpoint)"
                            value={configStore.otlpTracesEndpoint}
                            onChange={(v) => (configStore.otlpTracesEndpoint = v)}
                            placeholder="http://localhost:4317"
                        />
                        <FormField
                            label="收集详细 Traces (collect-detailed-traces)"
                            value={configStore.collectDetailedTraces}
                            onChange={(v) => (configStore.collectDetailedTraces = v)}
                            type="select"
                            options={[
                                { value: '', label: '无' },
                                { value: 'model', label: '模型 (model)' },
                                { value: 'worker', label: 'Worker (worker)' },
                                { value: 'all', label: '全部 (all)' },
                            ]}
                        />
                    </ConfigCard>

                    {/* 十三、其他配置 */}
                    <ConfigCard title={{ t('config.other.title') }} icon="🔧" defaultExpanded={false}>
                        <div className="form-row">
                            <FormField
                                label="设备类型 (device)"
                                value={configStore.device}
                                onChange={(v) => (configStore.device = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'cuda', label: 'CUDA' },
                                    { value: 'neuron', label: 'Neuron' },
                                    { value: 'cpu', label: 'CPU' },
                                    { value: 'openvino', label: 'OpenVINO' },
                                    { value: 'tpu', label: 'TPU' },
                                    { value: 'xpu', label: 'XPU' },
                                ]}
                            />
                            <FormField
                                label="随机种子 (seed)"
                                value={configStore.seed}
                                onChange={(v) => (configStore.seed = v)}
                                type="number"
                                min={0}
                            />
                        </div>
                        <FormField
                            label="服务模型名称 (served-model-name)"
                            value={configStore.servedModelName}
                            onChange={(v) => (configStore.servedModelName = v)}
                            placeholder="API 中使用的模型名称，多个用逗号分隔"
                        />
                        <div className="form-row">
                            <FormField
                                label="忽略模式 (ignore-patterns)"
                                value={configStore.ignorePatterns}
                                onChange={(v) => (configStore.ignorePatterns = v)}
                                placeholder="例如：*.pt,*.bin"
                            />
                            <FormField
                                label="模型加载器额外配置 (model-loader-extra-config)"
                                value={configStore.modelLoaderExtraConfig}
                                onChange={(v) => (configStore.modelLoaderExtraConfig = v)}
                                placeholder="JSON 格式配置"
                            />
                        </div>
                        <FormField
                            label="使用 Ray 引擎 (engine-use-ray)"
                            value={configStore.engineUseRay}
                            onChange={(v) => (configStore.engineUseRay = v)}
                            type="checkbox"
                        />
                    </ConfigCard>

                    {/* 十四、API 服务器配置 */}
                    <ConfigCard title={{ t('config.apiServer.title') }} icon="🌐" defaultExpanded={false}>
                        <div className="form-row">
                            <FormField
                                label="主机 (host)"
                                value={configStore.host}
                                onChange={(v) => (configStore.host = v)}
                                placeholder="0.0.0.0"
                            />
                            <FormField
                                label="端口 (port)"
                                value={configStore.port}
                                onChange={(v) => (configStore.port = v)}
                                type="number"
                                min={1}
                                max={65535}
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="SSL 密钥文件 (ssl-keyfile)"
                                value={configStore.sslKeyfile}
                                onChange={(v) => (configStore.sslKeyfile = v)}
                                placeholder="/path/to/key.pem"
                            />
                            <FormField
                                label="SSL 证书文件 (ssl-certfile)"
                                value={configStore.sslCertfile}
                                onChange={(v) => (configStore.sslCertfile = v)}
                                placeholder="/path/to/cert.pem"
                            />
                        </div>
                        <FormField
                            label="API 密钥 (api-key)"
                            value={configStore.apiKey}
                            onChange={(v) => (configStore.apiKey = v)}
                            type="text"
                            placeholder="留空则不需要 API 密钥认证"
                        />
                        <FormField
                            label="聊天模板 (chat-template)"
                            value={configStore.chatTemplate}
                            onChange={(v) => (configStore.chatTemplate = v)}
                            type="textarea"
                            placeholder="Jinja2 模板字符串或文件路径"
                        />
                        <div className="form-row">
                            <FormField
                                label="聊天模板内容格式 (chat-template-content-format)"
                                value={configStore.chatTemplateContentFormat}
                                onChange={(v) => (configStore.chatTemplateContentFormat = v)}
                                type="select"
                                options={[
                                    { value: 'auto', label: {{ t('quantization.options.auto.name') }} },
                                    { value: 'string', label: '字符串 (string)' },
                                    { value: 'openai', label: 'OpenAI 格式' },
                                ]}
                            />
                            <FormField
                                label="生成配置 (generation-config)"
                                value={configStore.generationConfig}
                                onChange={(v) => (configStore.generationConfig = v)}
                                placeholder="设为 vllm 禁用模型的 generation_config.json"
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="启用请求 ID 头 (enable-request-id-headers)"
                                value={configStore.enableRequestIdHeaders}
                                onChange={(v) => (configStore.enableRequestIdHeaders = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="启用离线文档 (enable-offline-docs)"
                                value={configStore.enableOfflineDocs}
                                onChange={(v) => (configStore.enableOfflineDocs = v)}
                                type="checkbox"
                            />
                        </div>
                        <FormField
                            label="运行模式 (runner)"
                            value={configStore.runner}
                            onChange={(v) => (configStore.runner = v)}
                            type="select"
                            options={[
                                { value: '', label: '默认' },
                                { value: 'pooling', label: 'Pooling (用于嵌入模型)' },
                            ]}
                        />
                    </ConfigCard>

                    {/* 十五、环境变量配置 */}
                    <ConfigCard title={{ t('config.env.title') }} icon="🔐" defaultExpanded={false}>
                        <FormField
                            label="最大音频文件大小 (VLLM_MAX_AUDIO_CLIP_FILESIZE_MB)"
                            value={configStore.envVllmMaxAudioClipFilesizeMb}
                            onChange={(v) => (configStore.envVllmMaxAudioClipFilesizeMb = v)}
                            type="number"
                            min={1}
                            max={1000}
                            help="Transcriptions API 允许的最大音频文件大小 (MB)"
                        />
                        <div className="form-row">
                            <FormField
                                label="禁用使用统计 (VLLM_NO_USAGE_STATS)"
                                value={configStore.envVllmNoUsageStats}
                                onChange={(v) => (configStore.envVllmNoUsageStats = v)}
                                type="checkbox"
                            />
                            <FormField
                                label="启用使用统计 (VLLM_USAGE_STATS_ENABLED)"
                                value={configStore.envVllmUsageStatsEnabled}
                                onChange={(v) => (configStore.envVllmUsageStatsEnabled = v)}
                                type="checkbox"
                            />
                        </div>
                        <div className="form-row">
                            <FormField
                                label="测试 IPC 路径 (VLLM_TEST_IPC_PATH)"
                                value={configStore.envVllmTestIpcPath || ''}
                                onChange={(v) =>
                                    (configStore.envVllmTestIpcPath = v || undefined)
                                }
                                placeholder="/tmp/vllm-test-ipc"
                            />
                            <FormField
                                label="配置文件路径 (VLLM_CONFIG_FILE)"
                                value={configStore.envVllmConfigFile || ''}
                                onChange={(v) =>
                                    (configStore.envVllmConfigFile = v || undefined)
                                }
                                placeholder="/path/to/config.yaml"
                            />
                        </div>
                        <FormField
                            label="允许远程代码 (VLLM_ALLOW_REMOTE_CODE)"
                            value={configStore.envVllmAllowRemoteCode}
                            onChange={(v) => (configStore.envVllmAllowRemoteCode = v)}
                            type="checkbox"
                        />
                    </ConfigCard>
                </div>
            </main>

            {/* ModelScope 搜索模态框 */}
            <ModelScopeModal
                isOpen={showModelScopeModal}
                onClose={() => setShowModelScopeModal(false)}
                onSelectModel={(model) => {
                    // 检查模型大小
                    const modelSizeGB = model.size ? model.size / (1024 * 1024 * 1024) : 0;
                    
                    if (modelSizeGB > 128) {
                        // 大于 128GB，先检查 4bit 量化后是否仍然超限
                        const sizeAfter4Bit = modelSizeGB * 0.25; // 4bit 是 FP16 的 1/4
                        if (sizeAfter4Bit > 128) {
                            // 4bit 量化后仍然超过 128GB，提示多机编排
                            setPendingModelId(model.model_id);
                            setShowMultiNodeAlert(true);
                        } else {
                            // 4bit 量化后可以放下，弹出量化选择
                            setPendingModelId(model.model_id);
                            setShowQuantModal(true);
                        }
                    } else {
                        // 小于 128GB，直接选择
                        configStore.selectModel(model.model_id);
                    }
                    setShowModelScopeModal(false);
                }}
            />

            {/* 多机编排提示 */}
            <div className={`modal-overlay ${showMultiNodeAlert ? 'modal-open' : ''}`} onClick={() => setShowMultiNodeAlert(false)} style={{ display: showMultiNodeAlert ? 'flex' : 'none' }}>
                <div className="modal-content modal-alert" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>⚠️ 显存不足提示</h2>
                        <button className="modal-close" onClick={() => setShowMultiNodeAlert(false)}>✕</button>
                    </div>
                    <div className="modal-body">
                        <p className="modal-message">
                            该模型即使在 4bit 量化情况下仍然超过 128GB 显存限制。
                        </p>
                        <p className="modal-message">
                            <strong>建议方案：</strong>
                        </p>
                        <ul className="modal-suggestions">
                            <li>使用多机编排（多卡/多节点部署）</li>
                            <li>选择更小的模型变体</li>
                            <li>使用更高的量化精度（如 INT4/FP4）</li>
                        </ul>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowMultiNodeAlert(false)}>
                            关闭
                        </button>
                        <button className="btn btn-primary" onClick={() => {
                            setShowMultiNodeAlert(false);
                            if (pendingModelId) {
                                configStore.selectModel(pendingModelId);
                                setPendingModelId('');
                            }
                        }}>
                            仍然选择此模型
                        </button>
                    </div>
                </div>
            </div>

            {/* 导入配置模态框 */}
            <div className={`modal-overlay ${showImportModal ? 'modal-open' : ''}`} onClick={() => setShowImportModal(false)} style={{ display: showImportModal ? 'flex' : 'none' }}>
                <div className="modal-content modal-import" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>📥 导入配置</h2>
                        <button className="modal-close" onClick={() => setShowImportModal(false)}>✕</button>
                    </div>
                    <div className="modal-body">
                        <p className="modal-hint">在此粘贴 YAML 配置以导入到当前配置中</p>
                        <textarea
                            className="import-textarea-full"
                            value={importText}
                            onChange={(e) => setImportText(e.target.value)}
                            placeholder="model: Qwen/Qwen2.5-7B-Instruct&#10;engine_args:&#10;  gpu_memory_utilization: 0.9&#10;  max_model_len: 4096"
                        />
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>
                            取消
                        </button>
                        <button className="btn btn-primary" onClick={handleImport}>
                            导入配置
                        </button>
                    </div>
                </div>
            </div>

            {/* 量化选择模态框 */}
            <div className={`modal-overlay ${showQuantModal ? 'modal-open' : ''}`} onClick={() => setShowQuantModal(false)} style={{ display: showQuantModal ? 'flex' : 'none' }}>
                <div className="modal-content modal-quant" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2>🔢 选择量化精度</h2>
                        <button className="modal-close" onClick={() => setShowQuantModal(false)}>✕</button>
                    </div>
                    <div className="modal-body">
                        <p className="modal-hint">选择模型权重量化精度，将影响显存占用</p>
                        <div className="quant-options">
                            <label className={`quant-option ${configStore.quantizationMode === 'auto' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="quantization"
                                    value="auto"
                                    checked={configStore.quantizationMode === 'auto'}
                                    onChange={(e) => { configStore.quantizationMode = e.target.value; }}
                                />
                                <div className="option-content">
                                    <span className="option-name">自动 (auto)</span>
                                    <span className="option-desc">根据模型配置文件自动选择</span>
                                </div>
                            </label>
                            <label className={`quant-option ${configStore.quantizationMode === 'bf16' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="quantization"
                                    value="bf16"
                                    checked={configStore.quantizationMode === 'bf16'}
                                    onChange={(e) => { configStore.quantizationMode = e.target.value; }}
                                />
                                <div className="option-content">
                                    <span className="option-name">BF16/FP16 (2 bytes)</span>
                                    <span className="option-desc">16 位浮点，标准精度</span>
                                </div>
                            </label>
                            <label className={`quant-option ${configStore.quantizationMode === 'int8' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="quantization"
                                    value="int8"
                                    checked={configStore.quantizationMode === 'int8'}
                                    onChange={(e) => { configStore.quantizationMode = e.target.value; }}
                                />
                                <div className="option-content">
                                    <span className="option-name">8-bit (1 byte)</span>
                                    <span className="option-desc">8 位量化 (INT8/FP8 E4M3/E5M2)，显存减半</span>
                                </div>
                            </label>
                            <label className={`quant-option ${configStore.quantizationMode === 'int4' ? 'active' : ''}`}>
                                <input
                                    type="radio"
                                    name="quantization"
                                    value="int4"
                                    checked={configStore.quantizationMode === 'int4'}
                                    onChange={(e) => { configStore.quantizationMode = e.target.value; }}
                                />
                                <div className="option-content">
                                    <span className="option-name">4-bit (0.5 byte)</span>
                                    <span className="option-desc">4 位量化 (INT4/NF4)，显存最低</span>
                                </div>
                            </label>
                        </div>
                        <div className="quant-preview">
                            <p>当前显存占用：<strong>{configStore.vramUsage.model}GB</strong> (模型) + {configStore.vramUsage.kvCache}GB (KV 缓存) = <strong>{configStore.vramUsage.total}GB</strong> (总计)</p>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button className="btn btn-secondary" onClick={() => setShowQuantModal(false)}>
                            取消
                        </button>
                        <button className="btn btn-primary" onClick={() => setShowQuantModal(false)}>
                            确认
                        </button>
                    </div>
                </div>
            </div>

            <footer className="app-footer">
                <p>基于 ALTAI 构建 | Powered by WebCell</p>
            </footer>
        </div>
    );
});
