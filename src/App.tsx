import React, { useState, useEffect } from 'react';
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
    label, value, onChange, type = 'text', options = [],
    min, max, step, placeholder, help, disabled = false,
}) => {
    const renderInput = () => {
        // 确保 value 始终有值，避免 uncontrolled/controlled 警告
        const safeValue = value !== undefined && value !== null ? value : (type === 'number' ? 0 : '');
        
        switch (type) {
            case 'checkbox':
                return (
                    <input
                        type="checkbox"
                        checked={!!safeValue}
                        onChange={(e) => onChange(e.target.checked)}
                        className="form-checkbox"
                        disabled={disabled}
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={safeValue}
                        onChange={(e) => onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
                        min={min} max={max} step={step}
                        className="form-input"
                        placeholder={placeholder}
                        disabled={disabled}
                    />
                );
            case 'select':
                return (
                    <select value={safeValue} onChange={(e) => onChange(e.target.value)} className="form-select" disabled={disabled}>
                        {options.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                    </select>
                );
            case 'textarea':
                return (
                    <textarea value={safeValue} onChange={(e) => onChange(e.target.value)} className="form-textarea" placeholder={placeholder} disabled={disabled} rows={3} />
                );
            default:
                return (
                    <input type="text" value={safeValue} onChange={(e) => onChange(e.target.value)} className="form-input" placeholder={placeholder} disabled={disabled} />
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
            <div className="config-card-header" onClick={() => setIsExpanded(!isExpanded)}>
                <h3 className="config-card-title">{icon} {title}</h3>
                <span className={`config-card-toggle ${isExpanded ? 'expanded' : ''}`}>▼</span>
            </div>
            {isExpanded && <div className="config-card-body">{children}</div>}
        </div>
    );
};

// ========== ModelScope 搜索模态框 ==========
interface ModelScopeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSelectModel: (model: any) => void;
    source?: 'modelscope' | 'huggingface';
    onSourceChange?: (source: 'modelscope' | 'huggingface') => void;
}

const formatSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '未知';
    const gb = bytes / (1024 * 1024 * 1024);
    return gb >= 1000 ? `${(gb / 1024).toFixed(1)}TB` : `${gb.toFixed(1)}GB`;
};

const formatTime = (timestamp: number): string => {
    if (!timestamp) return '未知';
    const now = Date.now() / 1000;
    const diff = now - timestamp;
    if (diff < 86400) return '今天';
    if (diff < 604800) return `${Math.floor(diff / 86400)}天前`;
    if (diff < 2592000) return `${Math.floor(diff / 604800)}周前`;
    const date = new Date(timestamp * 1000);
    return date.getFullYear().toString();
};

const ModelScopeModal: React.FC<ModelScopeModalProps> = observer(({ isOpen, onClose, onSelectModel, onSourceChange }) => {
    const { t } = useTranslation();
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('updated');
    const [currentSource, setCurrentSource] = useState<'modelscope' | 'huggingface'>('huggingface');

    const handleSourceChange = (src: 'modelscope' | 'huggingface') => {
        setCurrentSource(src);
        if (onSourceChange) onSourceChange(src);
    };

    const handleSearch = async () => {
        const endpoint = currentSource === 'huggingface' ? '/api/huggingface/search' : '/api/modelscope/search';
        await configStore.searchModelscope(searchQuery, 1, 20, sortBy, endpoint);
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleSearch();
    };

    const handleSortChange = (newSortBy: string) => {
        setSortBy(newSortBy);
        // 重新搜索
        handleSearch();
    };

    const handleSelectModel = (model: any) => {
        onSelectModel(model);
        onClose();
    };

    const Pagination = () => (
        configStore.modelscopeTotalPages > 1 && (
            <div className="modal-pagination">
                <span className="pagination-info">{t('search.modal.pagination.info', { page: configStore.modelscopePage, total: configStore.modelscopeTotalPages, count: configStore.modelscopeTotal })}</span>
                <div className="pagination-buttons">
                    <button className="btn btn-sm btn-secondary" onClick={() => configStore.prevModelscopePage()} disabled={configStore.modelscopePage <= 1}>{t('search.modal.pagination.prev')}</button>
                    <button className="btn btn-sm btn-secondary" onClick={() => configStore.nextModelscopePage()} disabled={configStore.modelscopePage >= configStore.modelscopeTotalPages}>{t('search.modal.pagination.next')}</button>
                </div>
            </div>
        )
    );

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{t('search.modal.title')}</h2>
                    <button className="modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="modal-source-selector">
                    <span className="source-label">模型来源:</span>
                    <button className={`source-btn ${currentSource === 'huggingface' ? 'active' : ''}`} onClick={() => handleSourceChange('huggingface')}>🤗 HuggingFace</button>
                    <button className={`source-btn ${currentSource === 'modelscope' ? 'active' : ''}`} onClick={() => handleSourceChange('modelscope')}>🔮 ModelScope</button>
                </div>
                <div className="modal-search-box">
                    <input type="text" className="search-input" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyPress={handleKeyPress} placeholder={t('search.modal.placeholder')} autoFocus />
                    <button className="btn btn-primary btn-search-submit" onClick={handleSearch} disabled={configStore.modelscopeLoading}>
                        {configStore.modelscopeLoading ? t('search.modal.searching') : t('search.modal.search')}
                    </button>
                </div>
                {configStore.modelscopeSearchResults.length > 0 && (
                    <>
                        <Pagination />
                        <div className="modal-sort">
                            <span className="sort-label">{t('search.modal.sort.label')}</span>
                            <div className="sort-buttons">
                                <button className={`sort-btn ${sortBy === 'downloads' ? 'active' : ''}`} onClick={() => handleSortChange('downloads')}>{t('search.modal.sort.downloads')}</button>
                                <button className={`sort-btn ${sortBy === 'likes' ? 'active' : ''}`} onClick={() => handleSortChange('likes')}>{t('search.modal.sort.likes')}</button>
                                <button className={`sort-btn ${sortBy === 'updated' ? 'active' : ''}`} onClick={() => handleSortChange('updated')}>{t('search.modal.sort.updated')}</button>
                                <button className={`sort-btn ${sortBy === 'name' ? 'active' : ''}`} onClick={() => handleSortChange('name')}>{t('search.modal.sort.name')}</button>
                            </div>
                        </div>
                        <div className="modal-results">
                            {configStore.modelscopeSearchResults.map((model: any, index: number) => (
                                <div key={`${model.model_id}-${index}`} className="modal-result-item" onClick={() => handleSelectModel(model)}>
                                    <div className="result-header">
                                        <span className="result-model-id">{model.model_id}</span>
                                        <span className="result-task">{model.task}</span>
                                        <a 
                                            href={currentSource === 'huggingface' ? `https://huggingface.co/${model.model_id}` : `https://modelscope.cn/models/${model.model_id}`} 
                                            target="_blank" 
                                            rel="noopener noreferrer" 
                                            className="result-link" 
                                            onClick={(e) => e.stopPropagation()} 
                                            title={t('search.modal.view')}
                                        >
                                            {t('search.modal.view')}
                                        </a>
                                    </div>
                                    <div className="result-details">
                                        <div className="detail-row">
                                            <span className="detail-label">{t('search.modal.details.parameters')}</span>
                                            <span className="detail-value">{model.parameters || (currentSource === 'huggingface' ? 'N/A' : t('search.modal.details.unknown'))}</span>
                                            <span className="detail-label">{t('search.modal.details.dtype')}</span>
                                            <span className="detail-value">{model.dtype || (currentSource === 'huggingface' ? 'N/A' : t('search.modal.details.auto'))}</span>
                                            <span className="detail-label">{t('search.modal.details.weight')}</span>
                                            <span className="detail-value">{formatSize(model.size)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="detail-label">{t('search.modal.details.framework')}</span>
                                            <span className="detail-value">{model.framework}</span>
                                            <span className="detail-label">{t('search.modal.details.license')}</span>
                                            <span className="detail-value">{model.license || (currentSource === 'huggingface' ? 'N/A' : t('search.modal.details.unknown'))}</span>
                                            <span className="detail-label">{t('search.modal.details.updated')}</span>
                                            <span className="detail-value">{formatTime(model.updated)}</span>
                                        </div>
                                    </div>
                                    {model.description && <div className="result-description">{model.description}</div>}
                                    <div className="result-meta">
                                        <span>📥 {model.downloads?.toLocaleString() || 0}</span>
                                        <span>❤️ {model.likes?.toLocaleString() || 0}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Pagination />
                    </>
                )}
                {!configStore.modelscopeLoading && configStore.modelscopeSearchResults.length === 0 && configStore.modelscopeSearchQuery && (
                    <div className="search-empty">{t('search.modal.noResults')}</div>
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
        document.title = lng === 'zh' ? 'vLLM 配置生成器' : 'vLLM Configuration Generator';
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

    const copyYaml = () => {
        navigator.clipboard.writeText(configStore.yamlConfig);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const copyCommandLine = () => {
        navigator.clipboard.writeText(configStore.commandLine);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
    };

    const handleImport = () => {
        try {
            if (configStore.importYaml(importText)) {
                setImportText('');
                setShowImportModal(false);
                alert(t('preview.import.success'));
            } else {
                alert(t('preview.import.error'));
            }
        } catch (e) {
            alert(t('preview.import.error'));
        }
    };

    const getPreviewContent = () => {
        switch (activeTab) {
            case 'cli': return <pre className="code-block">{configStore.commandLineArgs}</pre>;
            case 'env': return <pre className="code-block">{Object.entries(configStore.environmentVariables).map(([k, v]) => `${k}=${v}`).join('\n')}</pre>;
            default: return <pre className="code-block">{configStore.yamlConfig}</pre>;
        }
    };

    return (
        <div className="app-layout">
            {/* 顶部栏：Logo + 显存状态 + 设备兼容性 */}
            <header className="app-header-bar">
                <div className="logo-section">
                    <img src="https://avatars.githubusercontent.com/u/150661133?s=200&v=4" alt="vLLM Logo" className="app-logo" />
                    <span className="brand-name">ALTAI</span>
                </div>
                <div className="vram-section">
                    <div className="vram-label">{t('vram.title')}</div>
                    <div className="vram-bar-container">
                        <div className="vram-bar">
                            <div className="vram-bar-fill model" style={{ width: `${(configStore.vramUsage.model / 1.28).toFixed(1)}%` }} title={`${t('vram.modelWeight')}: ${configStore.vramUsage.model}GB`} onClick={() => setShowQuantModal(true)}></div>
                            <div className="vram-bar-fill kv" style={{ width: `${(configStore.vramUsage.kvCache / 1.28).toFixed(1)}%` }} title={`${t('vram.kvCache')}: ${configStore.vramUsage.kvCache}GB`}></div>
                        </div>
                        <div className="vram-bar-labels">
                            <span>0GB</span><span>64GB</span><span>128GB</span>
                        </div>
                        <div className="vram-legend">
                            <span className="legend-item"><span className="legend-color model"></span>{t('vram.modelWeight')} ({configStore.vramUsage.model}GB)</span>
                            <span className="legend-item"><span className="legend-color kv"></span>{t('vram.kvCache')} ({configStore.vramUsage.kvCache}GB)</span>
                            <div className="context-select">
                                <span className="context-label">{t('vram.context')}</span>
                                <select className="context-dropdown" value={configStore.maxModelLen} onChange={(e) => configStore.maxModelLen = parseInt(e.target.value)} title={configStore.modelMaxPositionEmbeddings > 0 ? t('alerts.contextLimit.modelMax', { max: configStore.modelMaxPositionEmbeddings }) : t('vram.context')}>
                                    {[512, 1024, 2048, 4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576].map(val => {
                                        if (configStore.modelMaxPositionEmbeddings > 0 && val > configStore.modelMaxPositionEmbeddings) return null;
                                        const label = val >= 1048576 ? `${val/1048576}M` : val >= 1024 ? `${val/1024}K` : val.toString();
                                        return <option key={val} value={val}>{label}</option>;
                                    })}
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="devices-section">
                    <div className="devices-title">{t('vram.devices')}</div>
                    <div className="devices-list">
                        {configStore.deviceCompatibility.map((item, i) => (
                            <span key={i} className={`device-badge ${item.compatible ? 'ok' : 'no'}`}>
                                {item.device} {item.compatible ? t('vram.deployable') : t('vram.notDeployable')}
                                {item.compatible && <span className="device-free">({t('vram.remaining')} {item.available.toFixed(1)}GB)</span>}
                            </span>
                        ))}
                    </div>
                </div>
            </header>

            {/* 主内容区：左侧预览 + 右侧表单 */}
            <main className="app-main-content">
                {/* 左侧：配置预览 */}
                <aside className="preview-panel">
                    <div className="preview-header">
                        <h2>{t('preview.title')}</h2>
                        <button className="btn btn-sm btn-info" onClick={() => setShowModelScopeModal(true)}>{t('search.button')}</button>
                    </div>
                    <div className="preview-tabs">
                        <button className={`tab ${activeTab === 'yaml' ? 'active' : ''}`} onClick={() => setActiveTab('yaml')}>{t('preview.tabs.yaml')}</button>
                        <button className={`tab ${activeTab === 'cli' ? 'active' : ''}`} onClick={() => setActiveTab('cli')}>{t('preview.tabs.cli')}</button>
                        <button className={`tab ${activeTab === 'env' ? 'active' : ''}`} onClick={() => setActiveTab('env')}>{t('preview.tabs.env')}</button>
                    </div>
                    <div className="preview-content">{getPreviewContent()}</div>
                    <div className="preview-actions">
                        <button className="btn btn-primary" onClick={downloadYaml}>{t('actions.downloadYaml')}</button>
                        <button className="btn btn-success" onClick={copyYaml}>{copySuccess ? t('preview.actions.copied') : t('actions.copyYaml')}</button>
                        <button className="btn btn-secondary" onClick={() => { setActiveTab('cli'); copyCommandLine(); }}>{t('actions.copyCommandLine')}</button>
                        <button className="btn btn-danger" onClick={() => configStore.reset()}>{t('actions.reset')}</button>
                        <button className="btn btn-secondary" onClick={() => setShowImportModal(true)}>{t('actions.import')}</button>
                    </div>
                </aside>

                {/* 右侧：配置表单 */}
                <div className="form-panel">
                    {/* 1. 核心模型配置 */}
                    <ConfigCard title={t('config.model.title')} icon="📦">
                        <FormField label={t('config.model.name')} value={configStore.model} onChange={(v) => configStore.model = v} placeholder={t('config.model.namePlaceholder')} help={t('config.model.nameHelp')} />
                        <div className="form-row">
                            <FormField label={t('config.model.tokenizer')} value={configStore.tokenizer} onChange={(v) => configStore.tokenizer = v} placeholder={t('config.model.tokenizerPlaceholder')} />
                            <FormField label={t('config.model.dtype')} value={configStore.dtype} onChange={(v) => configStore.dtype = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'half', label: 'Half' }, { value: 'float16', label: 'Float16' }, { value: 'bfloat16', label: 'BFloat16' }, { value: 'float', label: 'Float' }, { value: 'float32', label: 'Float32' }]} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.model.maxModelLen')} value={configStore.maxModelLen} onChange={(v) => configStore.maxModelLen = v} type="number" min={512} step={512} help={configStore.modelConfigLoaded ? t('alerts.contextLimit.modelMax', { max: configStore.modelMaxPositionEmbeddings }) : t('config.model.maxModelLenHelp')} />
                            <FormField label={t('config.model.loadFormat')} value={configStore.loadFormat} onChange={(v) => configStore.loadFormat = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'pt', label: 'PyTorch' }, { value: 'safetensors', label: 'Safetensors' }, { value: 'npcache', label: 'NumPy' }, { value: 'dummy', label: 'Dummy' }, { value: 'tensorizer', label: 'Tensorizer' }]} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.model.tokenizerMode')} value={configStore.tokenizerMode} onChange={(v) => configStore.tokenizerMode = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'slow', label: 'Slow' }, { value: 'mistral', label: 'Mistral' }]} />
                            <FormField label={t('config.model.guidedDecoding')} value={configStore.guidedDecodingBackend} onChange={(v) => configStore.guidedDecodingBackend = v} type="select" options={[{ value: 'outlines', label: 'Outlines' }, { value: 'lm_format_enforcer', label: 'LM Format Enforcer' }, { value: 'xgrammar', label: 'XGrammar' }]} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.model.configFormat')} value={configStore.configFormat} onChange={(v) => configStore.configFormat = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'hf', label: 'HuggingFace' }, { value: 'mistral', label: 'Mistral' }]} />
                            <FormField label={t('config.model.hfOverrides')} value={configStore.hfOverrides} onChange={(v) => configStore.hfOverrides = v} type="text" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.model.trustRemoteCode')} value={configStore.trustRemoteCode} onChange={(v) => configStore.trustRemoteCode = v} type="checkbox" />
                            <FormField label={t('config.model.revision')} value={configStore.revision} onChange={(v) => configStore.revision = v} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.model.codeRevision')} value={configStore.codeRevision} onChange={(v) => configStore.codeRevision = v} />
                            <FormField label={t('config.model.tokenizerRevision')} value={configStore.tokenizerRevision} onChange={(v) => configStore.tokenizerRevision = v} />
                        </div>
                        <FormField label={t('config.model.downloadDir')} value={configStore.downloadDir} onChange={(v) => configStore.downloadDir = v} />
                    </ConfigCard>

                    {/* 2. 分布式与并行 */}
                    <ConfigCard title={t('config.distributed.title')} icon="⚡">
                        <div className="form-row">
                            <FormField label={t('config.distributed.tensorParallel')} value={configStore.tensorParallelSize} onChange={(v) => configStore.tensorParallelSize = v} type="number" min={1} help={t('config.distributed.tensorParallelHelp')} />
                            <FormField label={t('config.distributed.pipelineParallel')} value={configStore.pipelineParallelSize} onChange={(v) => configStore.pipelineParallelSize = v} type="number" min={1} help={t('config.distributed.pipelineParallelHelp')} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.distributed.dataParallelSize')} value={configStore.dataParallelSize} onChange={(v) => configStore.dataParallelSize = v} type="number" min={1} />
                            <FormField label={t('config.distributed.maxParallelWorkers')} value={configStore.maxParallelLoadingWorkers} onChange={(v) => configStore.maxParallelLoadingWorkers = v} type="number" min={0} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.distributed.mmEncoderTpMode')} value={configStore.mmEncoderTpMode} onChange={(v) => configStore.mmEncoderTpMode = v} type="select" options={[{ value: 'data', label: 'Data' }, { value: 'tensor', label: 'Tensor' }, { value: 'none', label: 'None' }]} />
                            <FormField label={t('config.distributed.disableCustomAllReduce')} value={configStore.disableCustomAllReduce} onChange={(v) => configStore.disableCustomAllReduce = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.distributed.distributedExecutorBackend')} value={configStore.distributedExecutorBackend} onChange={(v) => configStore.distributedExecutorBackend = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'ray', label: 'Ray' }, { value: 'mp', label: 'MP' }, { value: 'uni', label: 'UNI' }, { value: 'none', label: 'None' }]} />
                            <FormField label={t('config.distributed.workerUseRay')} value={configStore.workerUseRay} onChange={(v) => configStore.workerUseRay = v} type="checkbox" />
                        </div>
                        <FormField label={t('config.distributed.rayWorkersUseNsight')} value={configStore.rayWorkersUseNsight} onChange={(v) => configStore.rayWorkersUseNsight = v} type="checkbox" />
                    </ConfigCard>

                    {/* 3. 内存与缓存 */}
                    <ConfigCard title={t('config.memory.title')} icon="💾">
                        <FormField label={t('config.memory.gpuMemoryUtil')} value={configStore.gpuMemoryUtilization} onChange={(v) => configStore.gpuMemoryUtilization = v} type="number" min={0.1} max={1.0} step={0.1} help={t('config.memory.gpuMemoryUtilHelp')} />
                        <div className="form-row">
                            <FormField label={t('config.memory.swapSpace')} value={configStore.swapSpace} onChange={(v) => configStore.swapSpace = v} type="number" min={0} help={t('config.memory.swapSpaceHelp')} />
                            <FormField label={t('config.memory.cpuOffload')} value={configStore.cpuOffloadGb} onChange={(v) => configStore.cpuOffloadGb = v} type="number" min={0} help={t('config.memory.cpuOffloadHelp')} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.memory.blockSize')} value={configStore.blockSize} onChange={(v) => configStore.blockSize = v} type="select" options={[{ value: '8', label: '8' }, { value: '16', label: '16' }, { value: '32', label: '32' }, { value: '64', label: '64' }, { value: '128', label: '128' }]} />
                            <FormField label={t('config.memory.kvCacheDtype')} value={configStore.kvCacheDtype} onChange={(v) => configStore.kvCacheDtype = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'fp8', label: 'FP8' }, { value: 'fp8_e4m3', label: 'FP8 E4M3' }, { value: 'fp8_e5m2', label: 'FP8 E5M2' }]} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.memory.prefixCachingHashAlgo')} value={configStore.prefixCachingHashAlgo} onChange={(v) => configStore.prefixCachingHashAlgo = v} type="select" options={[{ value: 'sha256', label: 'SHA256' }, { value: 'sip_hash', label: 'Sip Hash' }]} />
                            <FormField label={t('config.memory.enablePrefixCaching')} value={configStore.enablePrefixCaching} onChange={(v) => configStore.enablePrefixCaching = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.memory.disableSlidingWindow')} value={configStore.disableSlidingWindow} onChange={(v) => configStore.disableSlidingWindow = v} type="checkbox" />
                            <FormField label={t('config.memory.numGpuBlocksOverride')} value={configStore.numGpuBlocksOverride} onChange={(v) => configStore.numGpuBlocksOverride = v} type="number" min={0} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.memory.useV2BlockManager')} value={configStore.useV2BlockManager} onChange={(v) => configStore.useV2BlockManager = v} type="checkbox" />
                            <FormField label={t('config.memory.numLookaheadSlots')} value={configStore.numLookaheadSlots} onChange={(v) => configStore.numLookaheadSlots = v} type="number" min={0} />
                        </div>
                    </ConfigCard>

                    {/* 4. 调度器 */}
                    <ConfigCard title={t('config.scheduler.title')} icon="📋">
                        <div className="form-row">
                            <FormField label={t('config.scheduler.maxNumSeqs')} value={configStore.maxNumSeqs} onChange={(v) => configStore.maxNumSeqs = v} type="number" min={1} help={t('config.scheduler.maxNumSeqsHelp')} />
                            <FormField label={t('config.scheduler.maxNumBatchedTokens')} value={configStore.maxNumBatchedTokens} onChange={(v) => configStore.maxNumBatchedTokens = v} type="number" min={1} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.scheduler.numSchedulerSteps')} value={configStore.numSchedulerSteps} onChange={(v) => configStore.numSchedulerSteps = v} type="number" min={1} />
                            <FormField label={t('config.scheduler.enableChunkedPrefill')} value={configStore.enableChunkedPrefill} onChange={(v) => configStore.enableChunkedPrefill = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.scheduler.schedulingPolicy')} value={configStore.schedulingPolicy} onChange={(v) => configStore.schedulingPolicy = v} type="select" options={[{ value: 'fcfs', label: 'FCFS' }, { value: 'lpm', label: 'LPM' }]} />
                            <FormField label={t('config.scheduler.schedulerDelayFactor')} value={configStore.schedulerDelayFactor} onChange={(v) => configStore.schedulerDelayFactor = v} type="number" min={0} max={1} step={0.1} />
                        </div>
                        <FormField label={t('config.scheduler.preemptionMode')} value={configStore.preemptionMode} onChange={(v) => configStore.preemptionMode = v} type="select" options={[{ value: 'swap', label: 'Swap' }, { value: 'recompute', label: 'Recompute' }]} />
                    </ConfigCard>

                    {/* 5. 量化 */}
                    <ConfigCard title={t('config.quantization.title')} icon="🔧">
                        <FormField label={t('config.quantization.method')} value={configStore.quantization} onChange={(v) => configStore.quantization = v} type="select" options={[{ value: '', label: 'None' }, { value: 'awq', label: 'AWQ' }, { value: 'gptq', label: 'GPTQ' }, { value: 'fp8', label: 'FP8' }, { value: 'marlin', label: 'Marlin' }, { value: 'gguf', label: 'GGUF' }]} help={t('config.quantization.methodHelp')} />
                        <FormField label={t('config.quantization.paramPath')} value={configStore.quantizationParamPath} onChange={(v) => configStore.quantizationParamPath = v} placeholder={t('config.quantization.paramPathHelp')} />
                    </ConfigCard>

                    {/* 6. RoPE 配置 */}
                    <ConfigCard title={t('config.rope.title')} icon="⚙️">
                        <div className="form-row">
                            <FormField label={t('config.rope.ropeTheta')} value={configStore.ropeTheta} onChange={(v) => configStore.ropeTheta = v} type="number" />
                            <FormField label={t('config.rope.maxSeqLenCapture')} value={configStore.maxSeqLenToCapture} onChange={(v) => configStore.maxSeqLenToCapture = v} type="number" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.rope.enforceEager')} value={configStore.enforceEager} onChange={(v) => configStore.enforceEager = v} type="checkbox" />
                            <FormField label={t('config.rope.useV2BlockManager')} value={configStore.useV2BlockManager} onChange={(v) => configStore.useV2BlockManager = v} type="checkbox" />
                        </div>
                        <FormField label={t('config.rope.ropeScaling')} value={configStore.ropeScaling} onChange={(v) => configStore.ropeScaling = v} type="text" help={t('config.rope.ropeScalingHelp')} />
                    </ConfigCard>

                    {/* 7. LoRA 适配器 */}
                    <ConfigCard title={t('config.lora.title')} icon="🔌">
                        <div className="form-row">
                            <FormField label={t('config.lora.enableLora')} value={configStore.enableLora} onChange={(v) => configStore.enableLora = v} type="checkbox" />
                            <FormField label={t('config.lora.maxLoras')} value={configStore.maxLoras} onChange={(v) => configStore.maxLoras = v} type="number" min={1} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.lora.maxLoraRank')} value={configStore.maxLoraRank} onChange={(v) => configStore.maxLoraRank = v} type="number" min={1} />
                            <FormField label={t('config.lora.loraExtraVocabSize')} value={configStore.loraExtraVocabSize} onChange={(v) => configStore.loraExtraVocabSize = v} type="number" min={0} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.lora.loraDtype')} value={configStore.loraDtype} onChange={(v) => configStore.loraDtype = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'float16', label: 'Float16' }, { value: 'bfloat16', label: 'BFloat16' }, { value: 'float32', label: 'Float32' }]} />
                            <FormField label={t('config.lora.maxCpuLoras')} value={configStore.maxCpuLoras} onChange={(v) => configStore.maxCpuLoras = v} type="number" min={0} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.lora.longLoraScalingFactors')} value={configStore.longLoraScalingFactors} onChange={(v) => configStore.longLoraScalingFactors = v} type="text" />
                            <FormField label={t('config.lora.fullyShardedLoras')} value={configStore.fullyShardedLoras} onChange={(v) => configStore.fullyShardedLoras = v} type="checkbox" />
                        </div>
                        <FormField label={t('config.lora.qloraAdapterNameOrPath')} value={configStore.qloraAdapterNameOrPath} onChange={(v) => configStore.qloraAdapterNameOrPath = v} type="text" />
                    </ConfigCard>

                    {/* 8. Tokenizer 池 */}
                    <ConfigCard title={t('config.tokenizerPool.title')} icon="🔄">
                        <div className="form-row">
                            <FormField label={t('config.tokenizerPool.poolSize')} value={configStore.tokenizerPoolSize} onChange={(v) => configStore.tokenizerPoolSize = v} type="number" min={0} help={t('config.tokenizerPool.poolSizeHelp')} />
                            <FormField label={t('config.tokenizerPool.poolType')} value={configStore.tokenizerPoolType} onChange={(v) => configStore.tokenizerPoolType = v} type="select" options={[{ value: 'ray', label: 'Ray' }, { value: 'mp', label: 'Multiprocessing' }]} />
                        </div>
                        <FormField label={t('config.tokenizerPool.poolExtraConfig')} value={configStore.tokenizerPoolExtraConfig} onChange={(v) => configStore.tokenizerPoolExtraConfig = v} type="text" />
                    </ConfigCard>

                    {/* 9. Tokenizer 池 */}
                    <ConfigCard title={t('config.tokenizerPool.title')} icon="🔄">
                        <div className="form-row">
                            <FormField label={t('config.tokenizerPool.poolSize')} value={configStore.tokenizerPoolSize} onChange={(v) => configStore.tokenizerPoolSize = v} type="number" min={0} help={t('config.tokenizerPool.poolSizeHelp')} />
                            <FormField label={t('config.tokenizerPool.poolType')} value={configStore.tokenizerPoolType} onChange={(v) => configStore.tokenizerPoolType = v} type="select" options={[{ value: 'ray', label: 'Ray' }, { value: 'mp', label: 'Multiprocessing' }]} />
                        </div>
                        <FormField label={t('config.tokenizerPool.poolExtraConfig')} value={configStore.tokenizerPoolExtraConfig} onChange={(v) => configStore.tokenizerPoolExtraConfig = v} type="text" />
                    </ConfigCard>

                    {/* 10. 多模态配置 */}
                    <ConfigCard title={t('config.multimodal.title')} icon="🖼️">
                        <FormField label={t('config.multimodal.limitMmPerPrompt')} value={configStore.limitMmPerPrompt} onChange={(v) => configStore.limitMmPerPrompt = v} type="text" help={t('config.multimodal.limitMmPerPromptHelp')} />
                        <FormField label={t('config.multimodal.mmProcessorKwargs')} value={configStore.mmProcessorKwargs} onChange={(v) => configStore.mmProcessorKwargs = v} type="text" />
                    </ConfigCard>

                    {/* 11. 推测解码 */}
                    <ConfigCard title={t('config.speculative.title')} icon="🔮">
                        <FormField label={t('config.speculative.speculativeModel')} value={configStore.speculativeModel} onChange={(v) => configStore.speculativeModel = v} placeholder={t('config.speculative.speculativeModelPlaceholder')} />
                        <div className="form-row">
                            <FormField label={t('config.speculative.numSpeculativeTokens')} value={configStore.numSpeculativeTokens} onChange={(v) => configStore.numSpeculativeTokens = v} type="number" min={1} />
                            <FormField label={t('config.speculative.speculativeMaxModelLen')} value={configStore.speculativeMaxModelLen} onChange={(v) => configStore.speculativeMaxModelLen = v} type="number" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.speculative.ngramPromptLookupMax')} value={configStore.ngramPromptLookupMax} onChange={(v) => configStore.ngramPromptLookupMax = v} type="number" min={0} />
                            <FormField label={t('config.speculative.ngramPromptLookupMin')} value={configStore.ngramPromptLookupMin} onChange={(v) => configStore.ngramPromptLookupMin = v} type="number" min={0} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.speculative.speculativeDisableMqaCache')} value={configStore.speculativeDisableMqaCache} onChange={(v) => configStore.speculativeDisableMqaCache = v} type="checkbox" />
                            <FormField label={t('config.speculative.speculativeDisableByBatchSize')} value={configStore.speculativeDisableByBatchSize} onChange={(v) => configStore.speculativeDisableByBatchSize = v} type="number" min={0} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.speculative.specDecodingAcceptanceMethod')} value={configStore.specDecodingAcceptanceMethod} onChange={(v) => configStore.specDecodingAcceptanceMethod = v} type="select" options={[{ value: 'rejection_sampler', label: 'Rejection Sampler' }, { value: 'typical_acceptance_sampler', label: 'Typical Acceptance Sampler' }]} />
                            <FormField label={t('config.speculative.disableLogprobsDuringSpecDecoding')} value={configStore.disableLogprobsDuringSpecDecoding} onChange={(v) => configStore.disableLogprobsDuringSpecDecoding = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.speculative.typicalAcceptanceSamplerPosteriorThreshold')} value={configStore.typicalAcceptanceSamplerPosteriorThreshold} onChange={(v) => configStore.typicalAcceptanceSamplerPosteriorThreshold = v} type="number" />
                            <FormField label={t('config.speculative.typicalAcceptanceSamplerPosteriorAlpha')} value={configStore.typicalAcceptanceSamplerPosteriorAlpha} onChange={(v) => configStore.typicalAcceptanceSamplerPosteriorAlpha = v} type="number" />
                        </div>
                    </ConfigCard>

                    {/* 12. API 服务器 */}
                    <ConfigCard title={t('config.apiServer.title')} icon="🌐">
                        <div className="form-row">
                            <FormField label={t('config.apiServer.host')} value={configStore.host} onChange={(v) => configStore.host = v} placeholder="0.0.0.0" />
                            <FormField label={t('config.apiServer.port')} value={configStore.port} onChange={(v) => configStore.port = v} type="number" placeholder="8000" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.apiServer.sslKeyfile')} value={configStore.sslKeyfile} onChange={(v) => configStore.sslKeyfile = v} />
                            <FormField label={t('config.apiServer.sslCertfile')} value={configStore.sslCertfile} onChange={(v) => configStore.sslCertfile = v} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.apiServer.sslCaCerts')} value={configStore.sslCaCerts} onChange={(v) => configStore.sslCaCerts = v} />
                            <FormField label={t('config.apiServer.sslCertReqs')} value={configStore.sslCertReqs} onChange={(v) => configStore.sslCertReqs = v} type="select" options={[{ value: '0', label: 'None' }, { value: '1', label: 'Optional' }, { value: '2', label: 'Required' }]} />
                        </div>
                        <FormField label={t('config.apiServer.apiKey')} value={configStore.apiKey} onChange={(v) => configStore.apiKey = v} placeholder={t('config.apiServer.apiKeyPlaceholder')} />
                        <FormField label={t('config.apiServer.allowedOrigins')} value={configStore.allowedOrigins} onChange={(v) => configStore.allowedOrigins = v} placeholder="*" />
                        <div className="form-row">
                            <FormField label={t('config.apiServer.responseRole')} value={configStore.responseRole} onChange={(v) => configStore.responseRole = v} />
                            <FormField label={t('config.apiServer.returnTokensAsTokenIds')} value={configStore.returnTokensAsTokenIds} onChange={(v) => configStore.returnTokensAsTokenIds = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.apiServer.enableAutoToolChoice')} value={configStore.enableAutoToolChoice} onChange={(v) => configStore.enableAutoToolChoice = v} type="checkbox" />
                            <FormField label={t('config.apiServer.toolCallParser')} value={configStore.toolCallParser} onChange={(v) => configStore.toolCallParser = v} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.apiServer.enableRequestIdHeaders')} value={configStore.enableRequestIdHeaders} onChange={(v) => configStore.enableRequestIdHeaders = v} type="checkbox" />
                            <FormField label={t('config.apiServer.disableFrontendMultiprocessing')} value={configStore.disableFrontendMultiprocessing} onChange={(v) => configStore.disableFrontendMultiprocessing = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.apiServer.uvicornLogLevel')} value={configStore.uvicornLogLevel} onChange={(v) => configStore.uvicornLogLevel = v} type="select" options={[{ value: 'debug', label: 'Debug' }, { value: 'info', label: 'Info' }, { value: 'warning', label: 'Warning' }, { value: 'error', label: 'Error' }]} />
                            <FormField label={t('config.apiServer.enableOfflineDocs')} value={configStore.enableOfflineDocs} onChange={(v) => configStore.enableOfflineDocs = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.apiServer.chatTemplate')} value={configStore.chatTemplate} onChange={(v) => configStore.chatTemplate = v} type="text" />
                            <FormField label={t('config.apiServer.chatTemplateContentFormat')} value={configStore.chatTemplateContentFormat} onChange={(v) => configStore.chatTemplateContentFormat = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'string', label: 'String' }, { value: 'openai', label: 'OpenAI' }]} />
                        </div>
                        <FormField label={t('config.apiServer.runner')} value={configStore.runner} onChange={(v) => configStore.runner = v} type="select" options={[{ value: '', label: 'Auto' }, { value: 'generate', label: 'Generate' }, { value: 'classify', label: 'Classify' }, { value: 'embed', label: 'Embed' }, { value: 'score', label: 'Score' }]} />
                    </ConfigCard>

                    {/* 13. 日志与监控 */}
                    <ConfigCard title={t('config.logging.title')} icon="📊">
                        <div className="form-row">
                            <FormField label={t('config.logging.disableLogStats')} value={configStore.disableLogStats} onChange={(v) => configStore.disableLogStats = v} type="checkbox" />
                            <FormField label={t('config.logging.disableLogRequests')} value={configStore.disableLogRequests} onChange={(v) => configStore.disableLogRequests = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.logging.maxLogLen')} value={configStore.maxLogLen} onChange={(v) => configStore.maxLogLen = v} type="number" min={0} />
                            <FormField label={t('config.logging.otlpTracesEndpoint')} value={configStore.otlpTracesEndpoint} onChange={(v) => configStore.otlpTracesEndpoint = v} />
                        </div>
                        <FormField label={t('config.logging.collectDetailedTraces')} value={configStore.collectDetailedTraces} onChange={(v) => configStore.collectDetailedTraces = v} />
                    </ConfigCard>

                    {/* 14. 其他配置 */}
                    <ConfigCard title={t('config.other.title')} icon="🔧">
                        <div className="form-row">
                            <FormField label={t('config.other.device')} value={configStore.device} onChange={(v) => configStore.device = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'cuda', label: 'CUDA' }, { value: 'cpu', label: 'CPU' }, { value: 'tpu', label: 'TPU' }]} />
                            <FormField label={t('config.other.seed')} value={configStore.seed} onChange={(v) => configStore.seed = v} type="number" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.other.servedModelName')} value={configStore.servedModelName} onChange={(v) => configStore.servedModelName = v} placeholder={t('config.other.servedModelNamePlaceholder')} />
                            <FormField label={t('config.other.modelImpl')} value={configStore.modelImpl} onChange={(v) => configStore.modelImpl = v} type="select" options={[{ value: 'auto', label: 'Auto' }, { value: 'vllm', label: 'vLLM' }, { value: 'transformers', label: 'Transformers' }]} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.other.disableAsyncOutputProc')} value={configStore.disableAsyncOutputProc} onChange={(v) => configStore.disableAsyncOutputProc = v} type="checkbox" />
                        </div>
                    </ConfigCard>

                    {/* 12. 环境变量 */}
                    <ConfigCard title={t('config.env.title')} icon="🔐">
                        <FormField label={t('config.env.maxAudioClipSize')} value={configStore.envVllmMaxAudioClipFilesizeMb || ''} onChange={(v) => configStore.envVllmMaxAudioClipFilesizeMb = v ? parseFloat(v) : undefined} type="number" placeholder="25" help={t('config.env.maxAudioClipSizeHelp')} />
                        <div className="form-row">
                            <FormField label={t('config.env.allowRemoteCode')} value={configStore.envVllmAllowRemoteCode} onChange={(v) => configStore.envVllmAllowRemoteCode = v} type="checkbox" />
                            <FormField label={t('config.env.noUsageStats')} value={configStore.envVllmNoUsageStats} onChange={(v) => configStore.envVllmNoUsageStats = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.env.usageStatsEnabled')} value={configStore.envVllmUsageStatsEnabled} onChange={(v) => configStore.envVllmUsageStatsEnabled = v} type="checkbox" />
                            <FormField label={t('config.env.testIpcPath')} value={configStore.envVllmTestIpcPath || ''} onChange={(v) => configStore.envVllmTestIpcPath = v} type="text" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.env.configFile')} value={configStore.envVllmConfigFile || ''} onChange={(v) => configStore.envVllmConfigFile = v} type="text" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.env.allowLongMaxModelLen')} value={configStore.envVllmAllowLongMaxModelLen} onChange={(v) => configStore.envVllmAllowLongMaxModelLen = v} type="checkbox" />
                            <FormField label={t('config.env.useModelscope')} value={configStore.envVllmUseModelscope} onChange={(v) => configStore.envVllmUseModelscope = v} type="checkbox" />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.env.attentionBackend')} value={configStore.envVllmAttentionBackend} onChange={(v) => configStore.envVllmAttentionBackend = v} type="select" options={[{ value: '', label: 'Auto' }, { value: 'FLASH_ATTN', label: 'FLASH_ATTN' }, { value: 'XFORMERS', label: 'XFORMERS' }, { value: 'ROCM_FLASH', label: 'ROCM_FLASH' }]} />
                            <FormField label={t('config.env.loggingLevel')} value={configStore.envVllmLoggingLevel} onChange={(v) => configStore.envVllmLoggingLevel = v} type="select" options={[{ value: 'DEBUG', label: 'DEBUG' }, { value: 'INFO', label: 'INFO' }, { value: 'WARNING', label: 'WARNING' }, { value: 'ERROR', label: 'ERROR' }]} />
                        </div>
                        <div className="form-row">
                            <FormField label={t('config.env.forceCpuWarmup')} value={configStore.envVllmForceCpuWarmup} onChange={(v) => configStore.envVllmForceCpuWarmup = v} type="checkbox" />
                            <FormField label={t('config.env.useAiterQuantization')} value={configStore.envVllmAiterQuantization} onChange={(v) => configStore.envVllmAiterQuantization = v} type="checkbox" />
                        </div>
                    </ConfigCard>
                </div>
            </main>

            {/* 页脚 */}
            <footer className="app-footer">
                <span>{t('app.footer')}</span>
                <div className="lang-switch">
                    <button className={`lang-btn ${i18n.language === 'zh' ? 'active' : ''}`} onClick={() => changeLanguage('zh')}>中文</button>
                    <button className={`lang-btn ${i18n.language === 'en' ? 'active' : ''}`} onClick={() => changeLanguage('en')}>EN</button>
                </div>
            </footer>

            {/* 模态框 */}
            <ModelScopeModal 
                isOpen={showModelScopeModal} 
                onClose={() => setShowModelScopeModal(false)} 
                onSelectModel={(model) => {
                    const sizeGB = model.size ? model.size / (1024 * 1024 * 1024) : 0;
                    if (sizeGB > 128) {
                        if (sizeGB * 0.25 > 128) { setPendingModelId(model.model_id); setShowMultiNodeAlert(true); }
                        else { setPendingModelId(model.model_id); setShowQuantModal(true); }
                    } else configStore.selectModel(model.model_id);
                    setShowModelScopeModal(false);
                }} 
            />

            {/* 多机编排提示 */}
            {showMultiNodeAlert && (
                <div className="modal-overlay" onClick={() => setShowMultiNodeAlert(false)}>
                    <div className="modal-content modal-alert" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>{t('alerts.multiNode.title')}</h2><button className="modal-close" onClick={() => setShowMultiNodeAlert(false)}>✕</button></div>
                        <div className="modal-body">
                            <p>{t('alerts.multiNode.message')}</p>
                            <p><strong>{t('alerts.multiNode.suggestions')}</strong></p>
                            <ul><li>{t('alerts.multiNode.suggestion1')}</li><li>{t('alerts.multiNode.suggestion2')}</li><li>{t('alerts.multiNode.suggestion3')}</li></ul>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowMultiNodeAlert(false)}>{t('actions.close')}</button>
                            <button className="btn btn-primary" onClick={() => { setShowMultiNodeAlert(false); if (pendingModelId) { configStore.selectModel(pendingModelId); setPendingModelId(''); } }}>{t('actions.keepModel')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 量化选择 */}
            {showQuantModal && (
                <div className="modal-overlay" onClick={() => setShowQuantModal(false)}>
                    <div className="modal-content modal-quant" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>{t('quantization.modal.title')}</h2><button className="modal-close" onClick={() => setShowQuantModal(false)}>✕</button></div>
                        <div className="modal-body">
                            <p className="modal-hint">{t('quantization.modal.hint')}</p>
                            <div className="quant-options">
                                <label className={`quant-option ${configStore.quantizationMode === 'auto' ? 'active' : ''}`}>
                                    <input type="radio" name="quant" value="auto" checked={configStore.quantizationMode === 'auto'} onChange={(e) => configStore.quantizationMode = e.target.value} />
                                    <span className="opt-name">{t('quantization.options.auto.name')}</span>
                                    <span className="opt-desc">{t('quantization.options.auto.desc')}</span>
                                </label>
                                <label className={`quant-option ${configStore.quantizationMode === 'fp8' ? 'active' : ''}`}>
                                    <input type="radio" name="quant" value="fp8" checked={configStore.quantizationMode === 'fp8'} onChange={(e) => configStore.quantizationMode = e.target.value} />
                                    <span className="opt-name">{t('quantization.options.fp8.name')}</span>
                                    <span className="opt-desc">{t('quantization.options.fp8.desc')}</span>
                                </label>
                                <label className={`quant-option ${configStore.quantizationMode === 'int4' ? 'active' : ''}`}>
                                    <input type="radio" name="quant" value="int4" checked={configStore.quantizationMode === 'int4'} onChange={(e) => configStore.quantizationMode = e.target.value} />
                                    <span className="opt-name">{t('quantization.options.int4.name')}</span>
                                    <span className="opt-desc">{t('quantization.options.int4.desc')}</span>
                                </label>
                            </div>
                            <div className="quant-preview"><p>{t('quantization.modal.currentUsage', { model: configStore.vramUsage.model, kv: configStore.vramUsage.kvCache, total: configStore.vramUsage.total })}</p></div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowQuantModal(false)}>{t('actions.cancel')}</button>
                            <button className="btn btn-primary" onClick={() => setShowQuantModal(false)}>{t('actions.confirm')}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* 导入配置 */}
            {showImportModal && (
                <div className="modal-overlay" onClick={() => setShowImportModal(false)}>
                    <div className="modal-content modal-import" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header"><h2>{t('preview.import.title')}</h2><button className="modal-close" onClick={() => setShowImportModal(false)}>✕</button></div>
                        <div className="modal-body">
                            <p className="modal-hint">{t('preview.import.placeholder')}</p>
                            <textarea className="import-textarea" value={importText} onChange={(e) => setImportText(e.target.value)} placeholder={t('preview.import.placeholder')} />
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setShowImportModal(false)}>{t('actions.cancel')}</button>
                            <button className="btn btn-primary" onClick={handleImport}>{t('preview.import.button')}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
});
