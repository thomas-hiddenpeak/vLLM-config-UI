import { makeAutoObservable, computed, action } from 'mobx';
import YAML from 'js-yaml';

/**
 * vLLM 配置数据存储 - 支持所有 vLLM serve 启动参数和环境变量
 */
export class ConfigStore {
    // ========== 一、核心模型参数 (Core Model) ==========
    model: string = 'Qwen/Qwen2.5-7B-Instruct';
    tokenizer: string = '';
    skipTokenizerInit: boolean = false;
    revision: string = 'master';
    codeRevision: string = '';
    tokenizerRevision: string = '';
    tokenizerMode: string = 'auto'; // auto, slow
    trustRemoteCode: boolean = false;
    downloadDir: string = '';
    loadFormat: string = 'auto'; // auto, pt, safetensors, npcache, dummy, tensorizer, sharded_state, gguf, bitsandbytes
    dtype: string = 'auto'; // auto, half, float16, bfloat16, float, float32
    maxModelLen: number = 4096;
    guidedDecodingBackend: string = 'outlines'; // outlines, lm-format-enforcer

    // ========== 二、分布式与并行参数 (Distributed & Parallel) ==========
    distributedExecutorBackend: string = 'auto'; // auto, ray, mp
    workerUseRay: boolean = false;
    pipelineParallelSize: number = 1;
    tensorParallelSize: number = 1;
    maxParallelLoadingWorkers: number = 0;
    rayWorkersUseNsight: boolean = false;
    disableCustomAllReduce: boolean = false;
    speculativeDraftTensorParallelSize: number = -1;

    // ========== 三、内存与缓存参数 (Memory & Cache) ==========
    blockSize: number = 16; // 8, 16, 32, 128, 256, 512, 1024, 2048
    kvCacheDtype: string = 'auto'; // auto, fp8, fp8_e5m2, fp8_e4m3
    quantizationParamPath: string = '';
    swapSpace: number = 4; // GB
    cpuOffloadGb: number = 0;
    gpuMemoryUtilization: number = 0.9;
    numGpuBlocksOverride?: number;
    enablePrefixCaching: boolean = false;
    disableSlidingWindow: boolean = false;
    useV2BlockManager: boolean = false;

    // ========== 四、调度与批处理参数 (Scheduler & Batch) ==========
    maxNumBatchedTokens?: number;
    maxNumSeqs: number = 256;
    numSchedulerSteps: number = 1;
    schedulerDelayFactor: number = 0.0;
    enableChunkedPrefill: boolean = false;
    preemptionMode: string = ''; // recompute, swap
    numLookaheadSlots: number = 0;

    // ========== 五、量化参数 (Quantization) ==========
    quantization: string = ''; // aqlm, awq, deepspeedfp, tpu_int8, fp8, fbgemm_fp8, marlin, gguf, gptq_marlin_24, gptq_marlin, awq_marlin, gptq, squeezellm, compressed-tensors, bitsandbytes, qqq, experts_int8, None
    speculativeModelQuantization: string = '';

    // ========== 六、RoPE 与性能优化 (RoPE & Performance) ==========
    ropeScaling: string = ''; // JSON: {"type":"dynamic","factor":2.0}
    ropeTheta: number = 0;
    enforceEager: boolean = false;
    maxContextLenToCapture?: number;
    maxSeqLenToCapture: number = 8192;

    // ========== 七、Tokenizer 池化参数 (Tokenizer Pool) ==========
    tokenizerPoolSize: number = 0;
    tokenizerPoolType: string = 'ray';
    tokenizerPoolExtraConfig: string = '';

    // 缺失的参数
    configFormat: string = 'auto';
    hfOverrides: string = '';
    dataParallelSize: number = 1;
    mmEncoderTpMode: string = 'data';
    prefixCachingHashAlgo: string = 'sha256';
    schedulingPolicy: string = 'fcfs';
    speculativeDisableMqaCache: boolean = false;
    mmProcessorKwargs: string = '';

    // ========== 八、多模态参数 (Multi-modal) ==========
    limitMmPerPrompt: string = ''; // JSON: image=16,video=2

    // ========== 九、LoRA 适配器参数 (LoRA) ==========
    enableLora: boolean = false;
    maxLoras: number = 1;
    maxLoraRank: number = 16;
    loraExtraVocabSize: number = 256;
    loraDtype: string = 'auto'; // auto, float16, bfloat16, float32
    longLoraScalingFactors: string = '';
    maxCpuLoras?: number;
    fullyShardedLoras: boolean = false;
    qloraAdapterNameOrPath: string = '';

    // ========== 十、Prompt Adapter 参数 ==========
    enablePromptAdapter: boolean = false;
    maxPromptAdapters: number = 1;
    maxPromptAdapterToken: number = 0;

    // ========== 十一、推测解码参数 (Speculative Decoding) ==========
    speculativeModel: string = '';
    numSpeculativeTokens: number = 0;
    speculativeMaxModelLen?: number;
    speculativeDisableByBatchSize?: number;
    ngramPromptLookupMax: number = 0;
    ngramPromptLookupMin: number = 0;
    specDecodingAcceptanceMethod: string = 'rejection_sampler'; // rejection_sampler, typical_acceptance_sampler
    typicalAcceptanceSamplerPosteriorThreshold: number = 0.09;
    typicalAcceptanceSamplerPosteriorAlpha: number = 0.3;
    disableLogprobsDuringSpecDecoding: boolean = true;

    // ========== 十二、日志与监控参数 (Logging & Monitoring) ==========
    disableLogStats: boolean = false;
    disableLogRequests: boolean = false;
    maxLogprobs: number = 20;
    maxLogLen: number = 0;
    otlpTracesEndpoint: string = '';
    collectDetailedTraces: string = ''; // model, worker, all

    // ========== 十三、其他参数 (Other) ==========
    device: string = 'auto';
    modelImpl: string = 'auto';
    disableAsyncOutputProc: boolean = false; // auto, cuda, neuron, cpu, openvino, tpu, xpu
    modelLoaderExtraConfig: string = '';
    ignorePatterns: string = '';
    servedModelName: string = 'RM-01 LLM';
    seed: number = 0;
    engineUseRay: boolean = false;

    // ========== 十四、API 服务器参数 (API Server) ==========
    host: string = '0.0.0.0';
    port: number = 8000;
    sslCaCerts: string = '';
    sslCertfile: string = '';
    sslKeyfile: string = '';
    sslCertReqs: number = 0;
    allowedOrigins: string = '*';
    apiKey: string = '';
    chatTemplate: string = '';
    chatTemplateContentFormat: string = 'auto'; // auto, string, openai
    generationConfig: string = '';
    responseRole: string = 'assistant';
    returnTokensAsTokenIds: boolean = false;
    enableAutoToolChoice: boolean = false;
    toolCallParser: string = '';
    enableRequestIdHeaders: boolean = false;
    disableFrontendMultiprocessing: boolean = false;
    enableOfflineDocs: boolean = false;
    runner: string = ''; // pooling
    uvicornLogLevel: string = 'info';

    // ========== 十五、环境变量 (Environment Variables) ==========
    envVllmMaxAudioClipFilesizeMb: number = 25;
    envVllmNoUsageStats: boolean = false;
    envVllmUsageStatsEnabled: boolean = false;
    envVllmTestIpcPath?: string;
    envVllmConfigFile?: string;
    envVllmAllowRemoteCode: boolean = false;
    envVllmAllowLongMaxModelLen: boolean = false;
    envVllmUseModelscope: boolean = false;
    envVllmAttentionBackend: string = '';
    envVllmForceCpuWarmup: boolean = false;
    envVllmAiterQuantization: boolean = false;
    envVllmLoggingLevel: string = 'INFO';

    // ========== 十六、模型搜索相关 ==========
    modelscopeSearchQuery: string = '';
    modelscopeSearchResults: any[] = [];
    modelscopeLoading: boolean = false;
    modelscopeError: string = '';
    modelscopeTotal: number = 0;
    modelscopePage: number = 1;
    modelscopePageSize: number = 20;
    modelscopeTotalPages: number = 0;

    // ========== 十七、显存计算相关 ==========
    modelParameters: string = ''; // 模型参数字符串，如 "7B", "14B"
    deployDevice: string = ''; // 部署设备：'' (自动), 'RM-01-128G', 'RM-01-64G'
    quantizationMode: string = 'auto'; // 量化模式：auto, bf16, int8, int4
    
    // ========== 十八、模型配置约束 ==========
    modelMaxPositionEmbeddings: number = 0; // 模型最大位置嵌入（上下文上限）
    modelHiddenSize: number = 0; // 隐藏层维度
    modelNumAttentionHeads: number = 0; // 注意力头数
    modelNumHiddenLayers: number = 0; // 隐藏层层数
    modelVocabSize: number = 0; // 词表大小
    modelConfigLoaded: boolean = false; // 是否已加载模型配置
    modelRawSize: number = 0; // 模型原始大小（GB）

    constructor() {
        makeAutoObservable(this, {
            yamlConfig: computed,
            commandLineArgs: computed,
            environmentVariables: computed,
            vramUsage: computed,
            deviceCompatibility: computed,
            importYaml: action,
            reset: action,
            searchModelscope: action,
        });
    }

    /**
     * 解析模型参数数量（从模型名中提取）
     */
    private parseModelParameters(): number {
        const modelLower = this.model.toLowerCase();
        
        // 尝试匹配参数字样，如 7B, 14B, 72B, 0.5B, 1.5B, 32B 等
        const paramMatch = modelLower.match(/(\d+\.?\d*)b/);
        if (paramMatch) {
            return parseFloat(paramMatch[1]) * 1000000000; // 转换为 B
        }
        
        // 尝试匹配 M 字样，如 500M
        const mParamMatch = modelLower.match(/(\d+)m/);
        if (mParamMatch) {
            return parseFloat(mParamMatch[1]) * 1000000; // 转换为 M
        }
        
        // 默认值：根据常见模型推断
        if (modelLower.includes('72b') || modelLower.includes('70b')) return 72000000000;
        if (modelLower.includes('34b')) return 34000000000;
        if (modelLower.includes('14b')) return 14000000000;
        if (modelLower.includes('7b')) return 7000000000;
        if (modelLower.includes('3b')) return 3000000000;
        if (modelLower.includes('1.5b') || modelLower.includes('1b')) return 1500000000;
        if (modelLower.includes('0.5b')) return 500000000;
        
        // 无法解析时返回 0
        return 0;
    }

    /**
     * 获取每个参数的字节数（根据量化精度）
     */
    private getBytesPerParamInternal(): number {
        // 优先使用量化模式
        if (this.quantizationMode !== 'auto') {
            switch (this.quantizationMode) {
                case 'bf16':
                case 'fp16':
                    return 2; // 16 位浮点 (BF16/FP16)
                case 'int8':
                    return 1; // 8 位量化 (INT8/FP8 E4M3/E5M2)
                case 'int4':
                    return 0.5; // 4 位量化 (INT4/NF4)
                default:
                    return 2;
            }
        }
        
        // 否则从 dtype 推断
        const dtype = this.dtype.toLowerCase();
        if (dtype === 'float32' || dtype === 'float') return 4;
        if (dtype === 'float16' || dtype === 'bfloat16' || dtype === 'half') return 2;
        if (dtype.includes('int8') || dtype.includes('8bit') || dtype.includes('fp8')) return 1;
        if (dtype.includes('int4') || dtype.includes('4bit') || dtype.includes('nf4')) return 0.5;
        // 默认 auto 按 16 位浮点计算
        return 2;
    }
    
    /**
     * 获取每个参数的字节数（公开方法）
     */
    getBytesPerParam(): number {
        return this.getBytesPerParamInternal();
    }

    /**
     * 计算显存占用（单位：GB）
     */
    get vramUsage(): { model: number; kvCache: number; total: number } {
        const params = this.parseModelParameters();
        if (params <= 0) {
            return { model: 0, kvCache: 0, total: 0 };
        }

        const bytesPerParam = this.getBytesPerParamInternal();
        
        // 模型权重显存（GB）= 参数量 × 每参数字节数 / 1024^3
        const modelVRAM = (params * bytesPerParam) / (1024 * 1024 * 1024);
        
        // KV 缓存显存估算（简化公式）
        // KV 缓存也受量化精度影响，因为 KV cache 的精度通常与模型权重精度一致
        // 经验公式：每 1000 token 约需 0.1-0.5GB × 量化系数
        const contextLen = this.maxModelLen;
        const quantFactor = bytesPerParam / 2; // 相对于 FP16 的系数
        const kvCacheVRAM = (contextLen / 1000) * 0.3 * (params / 7000000000) * quantFactor; // 以 7B 为基准
        
        // 总显存 = 模型权重 + KV 缓存 + 额外开销（10%）
        const totalVRAM = (modelVRAM + kvCacheVRAM) * 1.1;
        
        return {
            model: parseFloat(modelVRAM.toFixed(1)),
            kvCache: parseFloat(kvCacheVRAM.toFixed(1)),
            total: parseFloat(totalVRAM.toFixed(1)),
        };
    }

    /**
     * 获取设备兼容性信息
     */
    get deviceCompatibility(): { device: string; vram: number; compatible: boolean; available: number }[] {
        const usage = this.vramUsage.total;
        
        return [
            { device: 'RM-01 (128GB)', vram: 128, compatible: usage <= 128, available: 128 - usage },
            { device: 'RM-01 (64GB)', vram: 64, compatible: usage <= 64, available: 64 - usage },
        ];
    }

    /**
     * 生成 YAML 配置
     */
    get yamlConfig(): string {
        const config: Record<string, any> = {};

        // 核心模型参数
        config.model = this.model;
        if (this.tokenizer && this.tokenizer !== this.model) {
            config.tokenizer = this.tokenizer;
        }
        if (this.skipTokenizerInit) config.skip_tokenizer_init = true;
        if (this.revision !== 'master') config.revision = this.revision;
        if (this.codeRevision) config.code_revision = this.codeRevision;
        if (this.tokenizerRevision) config.tokenizer_revision = this.tokenizer_revision;
        if (this.tokenizerMode !== 'auto') config.tokenizer_mode = this.tokenizerMode;
        if (this.trustRemoteCode) config.trust_remote_code = true;
        if (this.downloadDir) config.download_dir = this.downloadDir;
        if (this.loadFormat !== 'auto') config.load_format = this.loadFormat;
        if (this.dtype !== 'auto') config.dtype = this.dtype;
        if (this.maxModelLen !== 4096) config.max_model_len = this.maxModelLen;
        if (this.guidedDecodingBackend !== 'outlines') {
            config.guided_decoding_backend = this.guidedDecodingBackend;
        }

        // 分布式与并行
        if (this.distributedExecutorBackend !== 'auto') {
            config.distributed_executor_backend = this.distributedExecutorBackend;
        }
        if (this.workerUseRay) config.worker_use_ray = true;
        if (this.pipelineParallelSize !== 1) {
            config.pipeline_parallel_size = this.pipelineParallelSize;
        }
        if (this.tensorParallelSize !== 1) {
            config.tensor_parallel_size = this.tensorParallelSize;
        }
        if (this.dataParallelSize !== 1) {
            config.data_parallel_size = this.dataParallelSize;
        }
        if (this.maxParallelLoadingWorkers > 0) {
            config.max_parallel_loading_workers = this.maxParallelLoadingWorkers;
        }
        if (this.mmEncoderTpMode !== 'data') {
            config.mm_encoder_tp_mode = this.mmEncoderTpMode;
        }
        if (this.rayWorkersUseNsight) config.ray_workers_use_nsight = true;
        if (this.disableCustomAllReduce) config.disable_custom_all_reduce = true;
        if (this.speculativeDraftTensorParallelSize !== -1) {
            config.speculative_draft_tensor_parallel_size = this.speculativeDraftTensorParallelSize;
        }

        // 内存与缓存
        if (this.blockSize !== 16) config.block_size = this.blockSize;
        if (this.kvCacheDtype !== 'auto') config.kv_cache_dtype = this.kvCacheDtype;
        if (this.quantizationParamPath) {
            config.quantization_param_path = this.quantizationParamPath;
        }
        if (this.swapSpace !== 4) config.swap_space = this.swapSpace;
        if (this.cpuOffloadGb > 0) config.cpu_offload_gb = this.cpuOffloadGb;
        if (this.gpuMemoryUtilization !== 0.9) {
            config.gpu_memory_utilization = this.gpuMemoryUtilization;
        }
        if (this.numGpuBlocksOverride) {
            config.num_gpu_blocks_override = this.numGpuBlocksOverride;
        }
        if (this.prefixCachingHashAlgo !== 'sha256') {
            config.prefix_caching_hash_algo = this.prefixCachingHashAlgo;
        }
        if (this.enablePrefixCaching) config.enable_prefix_caching = true;
        if (this.disableSlidingWindow) config.disable_sliding_window = true;
        if (this.useV2BlockManager) config.use_v2_block_manager = true;

        // 调度与批处理
        if (this.maxNumBatchedTokens) {
            config.max_num_batched_tokens = this.maxNumBatchedTokens;
        }
        if (this.maxNumSeqs !== 256) config.max_num_seqs = this.maxNumSeqs;
        if (this.numSchedulerSteps !== 1) {
            config.num_scheduler_steps = this.numSchedulerSteps;
        }
        if (this.schedulerDelayFactor !== 0) {
            config.scheduler_delay_factor = this.schedulerDelayFactor;
        }
        if (this.schedulingPolicy !== 'fcfs') {
            config.scheduling_policy = this.schedulingPolicy;
        }
        if (this.enableChunkedPrefill) config.enable_chunked_prefill = true;
        if (this.preemptionMode) config.preemption_mode = this.preemptionMode;
        if (this.numLookaheadSlots > 0) {
            config.num_lookahead_slots = this.numLookaheadSlots;
        }

        // 量化
        if (this.quantization) config.quantization = this.quantization;
        if (this.speculativeModelQuantization) {
            config.speculative_model_quantization = this.speculativeModelQuantization;
        }

        // RoPE 与性能
        if (this.ropeScaling) {
            try {
                config.rope_scaling = JSON.parse(this.ropeScaling);
            } catch (e) {
                // Ignore invalid JSON
            }
        }
        if (this.ropeTheta > 0) config.rope_theta = this.ropeTheta;
        if (this.enforceEager) config.enforce_eager = true;
        if (this.maxContextLenToCapture) {
            config.max_context_len_to_capture = this.maxContextLenToCapture;
        }
        if (this.maxSeqLenToCapture !== 8192) {
            config.max_seq_len_to_capture = this.maxSeqLenToCapture;
        }

        // Tokenizer 池化
        if (this.tokenizerPoolSize > 0) {
            config.tokenizer_pool_size = this.tokenizerPoolSize;
        }
        if (this.tokenizerPoolType !== 'ray') {
            config.tokenizer_pool_type = this.tokenizerPoolType;
        }
        if (this.tokenizerPoolExtraConfig) {
            try {
                config.tokenizer_pool_extra_config = JSON.parse(this.tokenizerPoolExtraConfig);
            } catch (e) {
                // Ignore invalid JSON
            }
        }

        // 模型配置格式和 HF 覆盖
        if (this.configFormat !== 'auto') {
            config.config_format = this.configFormat;
        }
        if (this.hfOverrides) {
            try {
                config.hf_overrides = JSON.parse(this.hfOverrides);
            } catch (e) {
                config.hf_overrides = this.hfOverrides;
            }
        }

        // 多模态
        if (this.limitMmPerPrompt) {
            try {
                config.limit_mm_per_prompt = JSON.parse(this.limitMmPerPrompt);
            } catch (e) {
                // Parse as key=value string
                const pairs = this.limitMmPerPrompt.split(',');
                const mmConfig: Record<string, number> = {};
                pairs.forEach((pair) => {
                    const [key, value] = pair.split('=');
                    if (key && value) mmConfig[key.trim()] = parseInt(value.trim());
                });
                if (Object.keys(mmConfig).length > 0) {
                    config.limit_mm_per_prompt = mmConfig;
                }
            }
        }
        if (this.mmProcessorKwargs) {
            try {
                config.mm_processor_kwargs = JSON.parse(this.mmProcessorKwargs);
            } catch (e) {
                config.mm_processor_kwargs = this.mmProcessorKwargs;
            }
        }

        // LoRA
        if (this.enableLora) config.enable_lora = true;
        if (this.maxLoras !== 1) config.max_loras = this.maxLoras;
        if (this.maxLoraRank !== 16) config.max_lora_rank = this.maxLoraRank;
        if (this.loraExtraVocabSize !== 256) {
            config.lora_extra_vocab_size = this.loraExtraVocabSize;
        }
        if (this.loraDtype !== 'auto') config.lora_dtype = this.loraDtype;
        if (this.longLoraScalingFactors) {
            config.long_lora_scaling_factors = this.longLoraScalingFactors.split(',').map((s) => parseFloat(s.trim()));
        }
        if (this.maxCpuLoras) config.max_cpu_loras = this.maxCpuLoras;
        if (this.fullyShardedLoras) config.fully_sharded_loras = true;
        if (this.qloraAdapterNameOrPath) {
            config.qlora_adapter_name_or_path = this.qloraAdapterNameOrPath;
        }

        // Prompt Adapter
        if (this.enablePromptAdapter) config.enable_prompt_adapter = true;
        if (this.maxPromptAdapters !== 1) config.max_prompt_adapters = this.maxPromptAdapters;
        if (this.maxPromptAdapterToken !== 0) {
            config.max_prompt_adapter_token = this.maxPromptAdapterToken;
        }

        // 推测解码
        if (this.speculativeModel) {
            config.speculative_model = this.speculativeModel;
        }
        if (this.numSpeculativeTokens > 0) {
            config.num_speculative_tokens = this.numSpeculativeTokens;
        }
        if (this.speculativeMaxModelLen) {
            config.speculative_max_model_len = this.speculativeMaxModelLen;
        }
        if (this.speculativeDisableByBatchSize) {
            config.speculative_disable_by_batch_size = this.speculativeDisableByBatchSize;
        }
        if (this.ngramPromptLookupMax > 0) {
            config.ngram_prompt_lookup_max = this.ngramPromptLookupMax;
        }
        if (this.ngramPromptLookupMin > 0) {
            config.ngram_prompt_lookup_min = this.ngramPromptLookupMin;
        }
        if (this.speculativeDisableMqaCache) {
            config.speculative_disable_mqa_cache = true;
        }
        if (this.specDecodingAcceptanceMethod !== 'rejection_sampler') {
            config.spec_decoding_acceptance_method = this.specDecodingAcceptanceMethod;
        }
        if (this.typicalAcceptanceSamplerPosteriorThreshold !== 0.09) {
            config.typical_acceptance_sampler_posterior_threshold = this.typicalAcceptanceSamplerPosteriorThreshold;
        }
        if (this.typicalAcceptanceSamplerPosteriorAlpha !== 0.3) {
            config.typical_acceptance_sampler_posterior_alpha = this.typicalAcceptanceSamplerPosteriorAlpha;
        }
        if (!this.disableLogprobsDuringSpecDecoding) {
            config.disable_logprobs_during_spec_decoding = false;
        }

        // 日志与监控
        if (this.disableLogStats) config.disable_log_stats = true;
        if (this.disableLogRequests) config.disable_log_requests = true;
        if (this.maxLogprobs !== 20) config.max_logprobs = this.maxLogprobs;
        if (this.maxLogLen > 0) config.max_log_len = this.maxLogLen;
        if (this.otlpTracesEndpoint) config.otlp_traces_endpoint = this.otlpTracesEndpoint;
        if (this.collectDetailedTraces) {
            config.collect_detailed_traces = this.collectDetailedTraces.split(',');
        }

        // 其他
        if (this.device !== 'auto') config.device = this.device;
        if (this.modelImpl !== 'auto') config.model_impl = this.modelImpl;
        if (this.disableAsyncOutputProc) config.disable_async_output_proc = true;
        if (this.modelLoaderExtraConfig) {
            try {
                config.model_loader_extra_config = JSON.parse(this.modelLoaderExtraConfig);
            } catch (e) {
                // Ignore invalid JSON
            }
        }
        if (this.ignorePatterns) {
            config.ignore_patterns = this.ignorePatterns.split(',').map((s) => s.trim());
        }
        if (this.servedModelName) {
            config.served_model_name = this.servedModelName.split(',').map((s) => s.trim());
        }
        if (this.seed !== 0) config.seed = this.seed;
        if (this.engineUseRay) config.engine_use_ray = true;

        // API 服务器参数
        const serverArgs: Record<string, any> = {};
        if (this.host !== '0.0.0.0') serverArgs.host = this.host;
        if (this.port !== 8000) serverArgs.port = this.port;
        if (this.sslKeyfile) serverArgs.ssl_keyfile = this.sslKeyfile;
        if (this.sslCertfile) serverArgs.ssl_certfile = this.sslCertfile;
        if (this.sslCaCerts) serverArgs.ssl_ca_certs = this.sslCaCerts;
        if (this.sslCertReqs !== 0) serverArgs.ssl_cert_reqs = this.sslCertReqs;
        if (this.allowedOrigins && this.allowedOrigins !== '*') serverArgs.allowed_origins = this.allowedOrigins.split(',');
        if (this.apiKey) serverArgs.api_key = this.apiKey;
        if (this.chatTemplate) serverArgs.chat_template = this.chatTemplate;
        if (this.chatTemplateContentFormat !== 'auto') {
            serverArgs.chat_template_content_format = this.chatTemplateContentFormat;
        }
        if (this.generationConfig) serverArgs.generation_config = this.generationConfig;
        if (this.responseRole !== 'assistant') serverArgs.response_role = this.responseRole;
        if (this.returnTokensAsTokenIds) serverArgs.return_tokens_as_token_ids = true;
        if (this.enableAutoToolChoice) serverArgs.enable_auto_tool_choice = true;
        if (this.toolCallParser) serverArgs.tool_call_parser = this.toolCallParser;
        if (this.enableRequestIdHeaders) serverArgs.enable_request_id_headers = true;
        if (this.disableFrontendMultiprocessing) serverArgs.disable_frontend_multiprocessing = true;
        if (this.enableOfflineDocs) serverArgs.enable_offline_docs = true;
        if (this.runner) serverArgs.runner = this.runner;
        if (this.uvicornLogLevel !== 'info') serverArgs.uvicorn_log_level = this.uvicornLogLevel;

        if (Object.keys(serverArgs).length > 0) {
            config.server_args = serverArgs;
        }

        // 环境变量
        const envVars: Record<string, any> = {};
        if (this.envVllmMaxAudioClipFilesizeMb !== 25) {
            envVars.VLLM_MAX_AUDIO_CLIP_FILESIZE_MB = this.envVllmMaxAudioClipFilesizeMb;
        }
        if (this.envVllmNoUsageStats) envVars.VLLM_NO_USAGE_STATS = true;
        if (this.envVllmUsageStatsEnabled) envVars.VLLM_USAGE_STATS_ENABLED = true;
        if (this.envVllmTestIpcPath) envVars.VLLM_TEST_IPC_PATH = this.envVllmTestIpcPath;
        if (this.envVllmConfigFile) envVars.VLLM_CONFIG_FILE = this.envVllmConfigFile;
        if (this.envVllmAllowRemoteCode) envVars.VLLM_ALLOW_REMOTE_CODE = true;
        if (this.envVllmAllowLongMaxModelLen) envVars.VLLM_ALLOW_LONG_MAX_MODEL_LEN = true;
        if (this.envVllmUseModelscope) envVars.VLLM_USE_MODELSCOPE = true;
        if (this.envVllmAttentionBackend) envVars.VLLM_ATTENTION_BACKEND = this.envVllmAttentionBackend;
        if (this.envVllmForceCpuWarmup) envVars.VLLM_FORCE_CPU_WARMUP = true;
        if (this.envVllmAiterQuantization) envVars.VLLM_USE_AITER_QUANTIZATION = true;
        if (this.envVllmLoggingLevel !== 'INFO') envVars.VLLM_LOGGING_LEVEL = this.envVllmLoggingLevel;

        if (Object.keys(envVars).length > 0) {
            config.environment = envVars;
        }

        return YAML.dump(config, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
        });
    }

    /**
     * 生成命令行参数
     */
    get commandLineArgs(): string {
        const args: string[] = ['vllm serve'];

        // 核心模型参数
        args.push(`--model "${this.model}"`);
        if (this.tokenizer && this.tokenizer !== this.model) {
            args.push(`--tokenizer "${this.tokenizer}"`);
        }
        if (this.skipTokenizerInit) args.push('--skip-tokenizer-init');
        if (this.revision !== 'master') args.push(`--revision "${this.revision}"`);
        if (this.codeRevision) args.push(`--code-revision "${this.codeRevision}"`);
        if (this.tokenizerRevision) args.push(`--tokenizer-revision "${this.tokenizerRevision}"`);
        if (this.tokenizerMode !== 'auto') args.push(`--tokenizer-mode "${this.tokenizerMode}"`);
        if (this.trustRemoteCode) args.push('--trust-remote-code');
        if (this.downloadDir) args.push(`--download-dir "${this.downloadDir}"`);
        if (this.loadFormat !== 'auto') args.push(`--load-format "${this.loadFormat}"`);
        if (this.dtype !== 'auto') args.push(`--dtype "${this.dtype}"`);
        if (this.maxModelLen !== 4096) args.push(`--max-model-len ${this.maxModelLen}`);
        if (this.guidedDecodingBackend !== 'outlines') {
            args.push(`--guided-decoding-backend "${this.guidedDecodingBackend}"`);
        }

        // 分布式与并行
        if (this.distributedExecutorBackend !== 'auto') {
            args.push(`--distributed-executor-backend "${this.distributedExecutorBackend}"`);
        }
        if (this.workerUseRay) args.push('--worker-use-ray');
        if (this.pipelineParallelSize !== 1) {
            args.push(`--pipeline-parallel-size ${this.pipelineParallelSize}`);
        }
        if (this.tensorParallelSize !== 1) {
            args.push(`--tensor-parallel-size ${this.tensorParallelSize}`);
        }
        if (this.dataParallelSize !== 1) {
            args.push(`--data-parallel-size ${this.dataParallelSize}`);
        }
        if (this.maxParallelLoadingWorkers > 0) {
            args.push(`--max-parallel-loading-workers ${this.maxParallelLoadingWorkers}`);
        }
        if (this.mmEncoderTpMode !== 'data') {
            args.push(`--mm-encoder-tp-mode "${this.mmEncoderTpMode}"`);
        }
        if (this.rayWorkersUseNsight) args.push('--ray-workers-use-nsight');
        if (this.disableCustomAllReduce) args.push('--disable-custom-all-reduce');
        if (this.speculativeDraftTensorParallelSize !== -1) {
            args.push(`--speculative-draft-tensor-parallel-size ${this.speculativeDraftTensorParallelSize}`);
        }

        // 内存与缓存
        if (this.blockSize !== 16) args.push(`--block-size ${this.blockSize}`);
        if (this.kvCacheDtype !== 'auto') args.push(`--kv-cache-dtype "${this.kvCacheDtype}"`);
        if (this.quantizationParamPath) {
            args.push(`--quantization-param-path "${this.quantizationParamPath}"`);
        }
        if (this.swapSpace !== 4) args.push(`--swap-space ${this.swapSpace}`);
        if (this.cpuOffloadGb > 0) args.push(`--cpu-offload-gb ${this.cpuOffloadGb}`);
        if (this.gpuMemoryUtilization !== 0.9) {
            args.push(`--gpu-memory-utilization ${this.gpuMemoryUtilization}`);
        }
        if (this.numGpuBlocksOverride) {
            args.push(`--num-gpu-blocks-override ${this.numGpuBlocksOverride}`);
        }
        if (this.prefixCachingHashAlgo !== 'sha256') {
            args.push(`--prefix-caching-hash-algo "${this.prefixCachingHashAlgo}"`);
        }
        if (this.enablePrefixCaching) args.push('--enable-prefix-caching');
        if (this.disableSlidingWindow) args.push('--disable-sliding-window');
        if (this.useV2BlockManager) args.push('--use-v2-block-manager');

        // 调度与批处理
        if (this.maxNumBatchedTokens) {
            args.push(`--max-num-batched-tokens ${this.maxNumBatchedTokens}`);
        }
        if (this.maxNumSeqs !== 256) args.push(`--max-num-seqs ${this.maxNumSeqs}`);
        if (this.numSchedulerSteps !== 1) {
            args.push(`--num-scheduler-steps ${this.numSchedulerSteps}`);
        }
        if (this.schedulerDelayFactor !== 0) {
            args.push(`--scheduler-delay-factor ${this.schedulerDelayFactor}`);
        }
        if (this.schedulingPolicy !== 'fcfs') {
            args.push(`--scheduling-policy "${this.schedulingPolicy}"`);
        }
        if (this.enableChunkedPrefill) args.push('--enable-chunked-prefill');
        if (this.preemptionMode) args.push(`--preemption-mode "${this.preemptionMode}"`);
        if (this.numLookaheadSlots > 0) {
            args.push(`--num-lookahead-slots ${this.numLookaheadSlots}`);
        }

        // 量化
        if (this.quantization) args.push(`--quantization "${this.quantization}"`);
        if (this.speculativeModelQuantization) {
            args.push(`--speculative-model-quantization "${this.speculativeModelQuantization}"`);
        }

        // RoPE 与性能
        if (this.ropeScaling) args.push(`--rope-scaling "${this.ropeScaling.replace(/"/g, '\\"')}"`);
        if (this.ropeTheta > 0) args.push(`--rope-theta ${this.ropeTheta}`);
        if (this.enforceEager) args.push('--enforce-eager');
        if (this.maxContextLenToCapture) {
            args.push(`--max-context-len-to-capture ${this.maxContextLenToCapture}`);
        }
        if (this.maxSeqLenToCapture !== 8192) {
            args.push(`--max-seq-len-to-capture ${this.maxSeqLenToCapture}`);
        }

        // Tokenizer 池化
        if (this.tokenizerPoolSize > 0) {
            args.push(`--tokenizer-pool-size ${this.tokenizerPoolSize}`);
        }
        if (this.tokenizerPoolType !== 'ray') {
            args.push(`--tokenizer-pool-type "${this.tokenizerPoolType}"`);
        }
        if (this.tokenizerPoolExtraConfig) {
            args.push(`--tokenizer-pool-extra-config "${this.tokenizerPoolExtraConfig}"`);
        }

        // 模型配置格式和 HF 覆盖
        if (this.configFormat !== 'auto') {
            args.push(`--config-format "${this.configFormat}"`);
        }
        if (this.hfOverrides) {
            args.push(`--hf-overrides '${this.hfOverrides}'`);
        }

        // 多模态
        if (this.limitMmPerPrompt) {
            args.push(`--limit-mm-per-prompt "${this.limitMmPerPrompt}"`);
        }
        if (this.mmProcessorKwargs) {
            args.push(`--mm-processor-kwargs '${this.mmProcessorKwargs}'`);
        }

        // LoRA
        if (this.enableLora) args.push('--enable-lora');
        if (this.maxLoras !== 1) args.push(`--max-loras ${this.maxLoras}`);
        if (this.maxLoraRank !== 16) args.push(`--max-lora-rank ${this.maxLoraRank}`);
        if (this.loraExtraVocabSize !== 256) {
            args.push(`--lora-extra-vocab-size ${this.loraExtraVocabSize}`);
        }
        if (this.loraDtype !== 'auto') args.push(`--lora-dtype "${this.loraDtype}"`);
        if (this.longLoraScalingFactors) {
            args.push(`--long-lora-scaling-factors "${this.longLoraScalingFactors}"`);
        }
        if (this.maxCpuLoras) args.push(`--max-cpu-loras ${this.maxCpuLoras}`);
        if (this.fullyShardedLoras) args.push('--fully-sharded-loras');
        if (this.qloraAdapterNameOrPath) {
            args.push(`--qlora-adapter-name-or-path "${this.qloraAdapterNameOrPath}"`);
        }

        // Prompt Adapter
        if (this.enablePromptAdapter) args.push('--enable-prompt-adapter');
        if (this.maxPromptAdapters !== 1) {
            args.push(`--max-prompt-adapters ${this.maxPromptAdapters}`);
        }
        if (this.maxPromptAdapterToken !== 0) {
            args.push(`--max-prompt-adapter-token ${this.maxPromptAdapterToken}`);
        }

        // 推测解码
        if (this.speculativeModel) {
            args.push(`--speculative-model "${this.speculativeModel}"`);
        }
        if (this.numSpeculativeTokens > 0) {
            args.push(`--num-speculative-tokens ${this.numSpeculativeTokens}`);
        }
        if (this.speculativeMaxModelLen) {
            args.push(`--speculative-max-model-len ${this.speculativeMaxModelLen}`);
        }
        if (this.speculativeDisableByBatchSize) {
            args.push(`--speculative-disable-by-batch-size ${this.speculativeDisableByBatchSize}`);
        }
        if (this.ngramPromptLookupMax > 0) {
            args.push(`--ngram-prompt-lookup-max ${this.ngramPromptLookupMax}`);
        }
        if (this.ngramPromptLookupMin > 0) {
            args.push(`--ngram-prompt-lookup-min ${this.ngramPromptLookupMin}`);
        }
        if (this.speculativeDisableMqaCache) {
            args.push('--speculative-disable-mqa-cache');
        }
        if (this.specDecodingAcceptanceMethod !== 'rejection_sampler') {
            args.push(`--spec-decoding-acceptance-method "${this.specDecodingAcceptanceMethod}"`);
        }
        if (this.typicalAcceptanceSamplerPosteriorThreshold !== 0.09) {
            args.push(`--typical-acceptance-sampler-posterior-threshold ${this.typicalAcceptanceSamplerPosteriorThreshold}`);
        }
        if (this.typicalAcceptanceSamplerPosteriorAlpha !== 0.3) {
            args.push(`--typical-acceptance-sampler-posterior-alpha ${this.typicalAcceptanceSamplerPosteriorAlpha}`);
        }
        if (!this.disableLogprobsDuringSpecDecoding) {
            args.push('--disable-logprobs-during-spec-decoding false');
        }

        // 日志与监控
        if (this.disableLogStats) args.push('--disable-log-stats');
        if (this.disableLogRequests) args.push('--disable-log-requests');
        if (this.maxLogprobs !== 20) args.push(`--max-logprobs ${this.maxLogprobs}`);
        if (this.maxLogLen > 0) args.push(`--max-log-len ${this.maxLogLen}`);
        if (this.otlpTracesEndpoint) {
            args.push(`--otlp-traces-endpoint "${this.otlpTracesEndpoint}"`);
        }
        if (this.collectDetailedTraces) {
            args.push(`--collect-detailed-traces "${this.collectDetailedTraces}"`);
        }

        // 其他
        if (this.device !== 'auto') args.push(`--device "${this.device}"`);
        if (this.modelImpl !== 'auto') args.push(`--model-impl "${this.modelImpl}"`);
        if (this.disableAsyncOutputProc) args.push('--disable-async-output-proc');
        if (this.modelLoaderExtraConfig) {
            args.push(`--model-loader-extra-config "${this.modelLoaderExtraConfig}"`);
        }
        if (this.ignorePatterns) {
            args.push(`--ignore-patterns "${this.ignorePatterns}"`);
        }
        if (this.servedModelName) {
            args.push(`--served-model-name "${this.servedModelName}"`);
        }
        if (this.seed !== 0) args.push(`--seed ${this.seed}`);
        if (this.engineUseRay) args.push('--engine-use-ray');

        // API 服务器参数
        if (this.host !== '0.0.0.0') args.push(`--host "${this.host}"`);
        if (this.port !== 8000) args.push(`--port ${this.port}`);
        if (this.sslKeyfile) args.push(`--ssl-keyfile "${this.sslKeyfile}"`);
        if (this.sslCertfile) args.push(`--ssl-certfile "${this.sslCertfile}"`);
        if (this.sslCaCerts) args.push(`--ssl-ca-certs "${this.sslCaCerts}"`);
        if (this.sslCertReqs !== 0) args.push(`--ssl-cert-reqs ${this.sslCertReqs}`);
        if (this.allowedOrigins !== '*') args.push(`--allowed-origins "${this.allowedOrigins}"`);
        if (this.apiKey) args.push(`--api-key "${this.apiKey}"`);
        if (this.chatTemplate) args.push(`--chat-template "${this.chatTemplate}"`);
        if (this.chatTemplateContentFormat !== 'auto') {
            args.push(`--chat-template-content-format "${this.chatTemplateContentFormat}"`);
        }
        if (this.generationConfig) {
            args.push(`--generation-config "${this.generationConfig}"`);
        }
        if (this.responseRole !== 'assistant') args.push(`--response-role "${this.responseRole}"`);
        if (this.returnTokensAsTokenIds) args.push('--return-tokens-as-token-ids');
        if (this.enableAutoToolChoice) args.push('--enable-auto-tool-choice');
        if (this.toolCallParser) args.push(`--tool-call-parser "${this.toolCallParser}"`);
        if (this.enableRequestIdHeaders) args.push('--enable-request-id-headers');
        if (this.disableFrontendMultiprocessing) args.push('--disable-frontend-multiprocessing');
        if (this.enableOfflineDocs) args.push('--enable-offline-docs');
        if (this.runner) args.push(`--runner "${this.runner}"`);
        if (this.uvicornLogLevel !== 'info') args.push(`--uvicorn-log-level "${this.uvicornLogLevel}"`);

        return args.join(' \\\n    ');
    }

    /**
     * 生成环境变量配置
     */
    get environmentVariables(): Record<string, string> {
        const env: Record<string, string> = {};

        if (this.envVllmMaxAudioClipFilesizeMb !== 25) {
            env.VLLM_MAX_AUDIO_CLIP_FILESIZE_MB = this.envVllmMaxAudioClipFilesizeMb.toString();
        }
        if (this.envVllmNoUsageStats) env.VLLM_NO_USAGE_STATS = '1';
        if (this.envVllmUsageStatsEnabled) env.VLLM_USAGE_STATS_ENABLED = '1';
        if (this.envVllmTestIpcPath) env.VLLM_TEST_IPC_PATH = this.envVllmTestIpcPath;
        if (this.envVllmConfigFile) env.VLLM_CONFIG_FILE = this.envVllmConfigFile;
        if (this.envVllmAllowRemoteCode) env.VLLM_ALLOW_REMOTE_CODE = '1';
        if (this.envVllmAllowLongMaxModelLen) env.VLLM_ALLOW_LONG_MAX_MODEL_LEN = '1';
        if (this.envVllmUseModelscope) env.VLLM_USE_MODELSCOPE = '1';
        if (this.envVllmAttentionBackend) env.VLLM_ATTENTION_BACKEND = this.envVllmAttentionBackend;
        if (this.envVllmForceCpuWarmup) env.VLLM_FORCE_CPU_WARMUP = '1';
        if (this.envVllmAiterQuantization) env.VLLM_USE_AITER_QUANTIZATION = '1';
        if (this.envVllmLoggingLevel !== 'INFO') env.VLLM_LOGGING_LEVEL = this.envVllmLoggingLevel;

        return env;
    }

    /**
     * 从 YAML 导入配置
     */
    importYaml(yamlString: string): boolean {
        try {
            const config = YAML.load(yamlString) as Record<string, any>;
            if (!config) return false;

            // 核心模型参数
            if (config.model) this.model = config.model;
            if (config.tokenizer) this.tokenizer = config.tokenizer;
            if (config.skip_tokenizer_init) this.skipTokenizerInit = config.skip_tokenizer_init;
            if (config.revision) this.revision = config.revision;
            if (config.code_revision) this.codeRevision = config.code_revision;
            if (config.tokenizer_revision) this.tokenizerRevision = config.tokenizer_revision;
            if (config.tokenizer_mode) this.tokenizerMode = config.tokenizer_mode;
            if (config.trust_remote_code) this.trustRemoteCode = config.trust_remote_code;
            if (config.download_dir) this.downloadDir = config.download_dir;
            if (config.load_format) this.loadFormat = config.load_format;
            if (config.dtype && config.dtype !== 'auto') this.dtype = config.dtype;
            if (config.max_model_len) this.maxModelLen = config.max_model_len;
            if (config.guided_decoding_backend) {
                this.guidedDecodingBackend = config.guided_decoding_backend;
            }

            // 分布式与并行
            if (config.distributed_executor_backend) {
                this.distributedExecutorBackend = config.distributed_executor_backend;
            }
            if (config.worker_use_ray) this.workerUseRay = config.worker_use_ray;
            if (config.pipeline_parallel_size) {
                this.pipelineParallelSize = config.pipeline_parallel_size;
            }
            if (config.tensor_parallel_size) {
                this.tensorParallelSize = config.tensor_parallel_size;
            }
            if (config.max_parallel_loading_workers) {
                this.maxParallelLoadingWorkers = config.max_parallel_loading_workers;
            }
            if (config.ray_workers_use_nsight) {
                this.rayWorkersUseNsight = config.ray_workers_use_nsight;
            }
            if (config.disable_custom_all_reduce) {
                this.disableCustomAllReduce = config.disable_custom_all_reduce;
            }

            // 内存与缓存
            if (config.block_size) this.blockSize = config.block_size;
            if (config.kv_cache_dtype) this.kvCacheDtype = config.kv_cache_dtype;
            if (config.quantization_param_path) {
                this.quantizationParamPath = config.quantization_param_path;
            }
            if (config.swap_space) this.swapSpace = config.swap_space;
            if (config.cpu_offload_gb) this.cpuOffloadGb = config.cpu_offload_gb;
            if (config.gpu_memory_utilization) {
                this.gpuMemoryUtilization = config.gpu_memory_utilization;
            }
            if (config.num_gpu_blocks_override) {
                this.numGpuBlocksOverride = config.num_gpu_blocks_override;
            }
            if (config.enable_prefix_caching) {
                this.enablePrefixCaching = config.enable_prefix_caching;
            }
            if (config.disable_sliding_window) {
                this.disableSlidingWindow = config.disable_sliding_window;
            }

            // 调度与批处理
            if (config.max_num_batched_tokens) {
                this.maxNumBatchedTokens = config.max_num_batched_tokens;
            }
            if (config.max_num_seqs) this.maxNumSeqs = config.max_num_seqs;
            if (config.num_scheduler_steps) {
                this.numSchedulerSteps = config.num_scheduler_steps;
            }
            if (config.scheduler_delay_factor) {
                this.schedulerDelayFactor = config.scheduler_delay_factor;
            }
            if (config.enable_chunked_prefill) {
                this.enableChunkedPrefill = config.enable_chunked_prefill;
            }
            if (config.preemption_mode) this.preemptionMode = config.preemption_mode;

            // 量化
            if (config.quantization) this.quantization = config.quantization;

            // RoPE
            if (config.rope_theta) this.ropeTheta = config.rope_theta;
            if (config.enforce_eager) this.enforceEager = config.enforce_eager;
            if (config.max_seq_len_to_capture) {
                this.maxSeqLenToCapture = config.max_seq_len_to_capture;
            }

            // Tokenizer 池化
            if (config.tokenizer_pool_size) {
                this.tokenizerPoolSize = config.tokenizer_pool_size;
            }
            if (config.tokenizer_pool_type) {
                this.tokenizerPoolType = config.tokenizer_pool_type;
            }

            // 模型配置格式和 HF 覆盖
            if (config.config_format) {
                this.configFormat = config.config_format;
            }
            if (config.hf_overrides) {
                this.hfOverrides = typeof config.hf_overrides === 'string' ? config.hf_overrides : JSON.stringify(config.hf_overrides);
            }

            // 分布式
            if (config.data_parallel_size) {
                this.dataParallelSize = config.data_parallel_size;
            }
            if (config.mm_encoder_tp_mode) {
                this.mmEncoderTpMode = config.mm_encoder_tp_mode;
            }

            // 内存
            if (config.prefix_caching_hash_algo) {
                this.prefixCachingHashAlgo = config.prefix_caching_hash_algo;
            }

            // 调度器
            if (config.scheduling_policy) {
                this.schedulingPolicy = config.scheduling_policy;
            }

            // LoRA
            if (config.enable_lora) this.enableLora = config.enable_lora;
            if (config.max_loras) this.maxLoras = config.max_loras;
            if (config.max_lora_rank) this.maxLoraRank = config.max_lora_rank;
            if (config.lora_extra_vocab_size) {
                this.loraExtraVocabSize = config.lora_extra_vocab_size;
            }
            if (config.lora_dtype) this.loraDtype = config.lora_dtype;

            // 推测解码
            if (config.speculative_model) {
                this.speculativeModel = config.speculative_model;
            }
            if (config.num_speculative_tokens) {
                this.numSpeculativeTokens = config.num_speculative_tokens;
            }
            if (config.speculative_disable_mqa_cache) {
                this.speculativeDisableMqaCache = config.speculative_disable_mqa_cache;
            }

            // 多模态
            if (config.mm_processor_kwargs) {
                this.mmProcessorKwargs = typeof config.mm_processor_kwargs === 'string' ? config.mm_processor_kwargs : JSON.stringify(config.mm_processor_kwargs);
            }

            // 日志
            if (config.disable_log_stats) this.disableLogStats = config.disable_log_stats;
            if (config.disable_log_requests) this.disableLogRequests = config.disable_log_requests;
            if (config.max_logprobs) this.maxLogprobs = config.max_logprobs;
            if (config.max_log_len) this.maxLogLen = config.max_log_len;

            // 其他
            if (config.model_impl) {
                this.modelImpl = config.model_impl;
            }
            if (config.disable_async_output_proc) {
                this.disableAsyncOutputProc = config.disable_async_output_proc;
            }

            // API 服务器参数
            const serverArgs = config.server_args || {};
            if (serverArgs.ssl_ca_certs) this.sslCaCerts = serverArgs.ssl_ca_certs;
            if (serverArgs.ssl_cert_reqs) this.sslCertReqs = serverArgs.ssl_cert_reqs;
            if (serverArgs.allowed_origins) this.allowedOrigins = Array.isArray(serverArgs.allowed_origins) ? serverArgs.allowed_origins.join(',') : serverArgs.allowed_origins;
            if (serverArgs.response_role) this.responseRole = serverArgs.response_role;
            if (serverArgs.return_tokens_as_token_ids) this.returnTokensAsTokenIds = serverArgs.return_tokens_as_token_ids;
            if (serverArgs.enable_auto_tool_choice) this.enableAutoToolChoice = serverArgs.enable_auto_tool_choice;
            if (serverArgs.tool_call_parser) this.toolCallParser = serverArgs.tool_call_parser;
            if (serverArgs.disable_frontend_multiprocessing) this.disableFrontendMultiprocessing = serverArgs.disable_frontend_multiprocessing;
            if (serverArgs.uvicorn_log_level) this.uvicornLogLevel = serverArgs.uvicorn_log_level;

            // 其他
            if (config.device && config.device !== 'auto') this.device = config.device;
            if (config.seed) this.seed = config.seed;
            if (config.served_model_name) {
                this.servedModelName = Array.isArray(config.served_model_name)
                    ? config.served_model_name.join(',')
                    : config.served_model_name;
            }

            // API 服务器参数
            if (serverArgs.host) this.host = serverArgs.host;
            if (serverArgs.port) this.port = serverArgs.port;
            if (serverArgs.ssl_keyfile) this.sslKeyfile = serverArgs.ssl_keyfile;
            if (serverArgs.ssl_certfile) this.sslCertfile = serverArgs.ssl_certfile;
            if (serverArgs.api_key) this.apiKey = serverArgs.api_key;
            if (serverArgs.chat_template) this.chatTemplate = serverArgs.chat_template;

            // 环境变量
            const envVars = config.environment || {};
            if (envVars.VLLM_MAX_AUDIO_CLIP_FILESIZE_MB) {
                this.envVllmMaxAudioClipFilesizeMb = envVars.VLLM_MAX_AUDIO_CLIP_FILESIZE_MB;
            }
            if (envVars.VLLM_NO_USAGE_STATS) this.envVllmNoUsageStats = true;
            if (envVars.VLLM_USAGE_STATS_ENABLED) this.envVllmUsageStatsEnabled = true;
            if (envVars.VLLM_TEST_IPC_PATH) {
                this.envVllmTestIpcPath = envVars.VLLM_TEST_IPC_PATH;
            }
            if (envVars.VLLM_CONFIG_FILE) {
                this.envVllmConfigFile = envVars.VLLM_CONFIG_FILE;
            }
            if (envVars.VLLM_ALLOW_REMOTE_CODE) this.envVllmAllowRemoteCode = true;
            if (envVars.VLLM_ALLOW_LONG_MAX_MODEL_LEN) this.envVllmAllowLongMaxModelLen = true;
            if (envVars.VLLM_USE_MODELSCOPE) this.envVllmUseModelscope = true;
            if (envVars.VLLM_ATTENTION_BACKEND) this.envVllmAttentionBackend = envVars.VLLM_ATTENTION_BACKEND;
            if (envVars.VLLM_FORCE_CPU_WARMUP) this.envVllmForceCpuWarmup = true;
            if (envVars.VLLM_USE_AITER_QUANTIZATION) this.envVllmAiterQuantization = true;
            if (envVars.VLLM_LOGGING_LEVEL) this.envVllmLoggingLevel = envVars.VLLM_LOGGING_LEVEL;

            return true;
        } catch (error) {
            console.error('导入 YAML 失败:', error);
            return false;
        }
    }

    /**
     * 重置为默认值
     */
    reset(): void {
        // 核心模型参数
        this.model = 'Qwen/Qwen2.5-7B-Instruct';
        this.tokenizer = '';
        this.skipTokenizerInit = false;
        this.revision = 'master';
        this.codeRevision = '';
        this.tokenizerRevision = '';
        this.tokenizerMode = 'auto';
        this.trustRemoteCode = false;
        this.downloadDir = '';
        this.loadFormat = 'auto';
        this.dtype = 'auto';
        this.maxModelLen = 4096;
        this.guidedDecodingBackend = 'outlines';

        // 分布式与并行
        this.distributedExecutorBackend = 'auto';
        this.workerUseRay = false;
        this.pipelineParallelSize = 1;
        this.tensorParallelSize = 1;
        this.maxParallelLoadingWorkers = 0;
        this.rayWorkersUseNsight = false;
        this.disableCustomAllReduce = false;
        this.speculativeDraftTensorParallelSize = -1;

        // 内存与缓存
        this.blockSize = 16;
        this.kvCacheDtype = 'auto';
        this.quantizationParamPath = '';
        this.swapSpace = 4;
        this.cpuOffloadGb = 0;
        this.gpuMemoryUtilization = 0.9;
        this.numGpuBlocksOverride = undefined;
        this.enablePrefixCaching = false;
        this.disableSlidingWindow = false;
        this.useV2BlockManager = false;

        // 调度与批处理
        this.maxNumBatchedTokens = undefined;
        this.maxNumSeqs = 256;
        this.numSchedulerSteps = 1;
        this.schedulerDelayFactor = 0.0;
        this.enableChunkedPrefill = false;
        this.preemptionMode = '';
        this.numLookaheadSlots = 0;

        // 量化
        this.quantization = '';
        this.speculativeModelQuantization = '';

        // RoPE
        this.ropeScaling = '';
        this.ropeTheta = 0;
        this.enforceEager = false;
        this.maxContextLenToCapture = undefined;
        this.maxSeqLenToCapture = 8192;

        // Tokenizer 池化
        this.tokenizerPoolSize = 0;
        this.tokenizerPoolType = 'ray';
        this.tokenizerPoolExtraConfig = '';

        // 多模态
        this.limitMmPerPrompt = '';

        // LoRA
        this.enableLora = false;
        this.maxLoras = 1;
        this.maxLoraRank = 16;
        this.loraExtraVocabSize = 256;
        this.loraDtype = 'auto';
        this.longLoraScalingFactors = '';
        this.maxCpuLoras = undefined;
        this.fullyShardedLoras = false;
        this.qloraAdapterNameOrPath = '';

        // Prompt Adapter
        this.enablePromptAdapter = false;
        this.maxPromptAdapters = 1;
        this.maxPromptAdapterToken = 0;

        // 推测解码
        this.speculativeModel = '';
        this.numSpeculativeTokens = 0;
        this.speculativeMaxModelLen = undefined;
        this.speculativeDisableByBatchSize = undefined;
        this.ngramPromptLookupMax = 0;
        this.ngramPromptLookupMin = 0;
        this.specDecodingAcceptanceMethod = 'rejection_sampler';
        this.typicalAcceptanceSamplerPosteriorThreshold = 0.09;
        this.typicalAcceptanceSamplerPosteriorAlpha = 0.3;
        this.disableLogprobsDuringSpecDecoding = true;

        // 日志与监控
        this.disableLogStats = false;
        this.disableLogRequests = false;
        this.maxLogprobs = 20;
        this.otlpTracesEndpoint = '';
        this.collectDetailedTraces = '';

        // 其他
        this.device = 'auto';
        this.modelLoaderExtraConfig = '';
        this.ignorePatterns = '';
        this.servedModelName = '';
        this.seed = 0;
        this.engineUseRay = false;

        // API 服务器参数
        this.host = '0.0.0.0';
        this.port = 8000;
        this.sslKeyfile = '';
        this.sslCertfile = '';
        this.apiKey = '';
        this.chatTemplate = '';
        this.chatTemplateContentFormat = 'auto';
        this.generationConfig = '';
        this.enableRequestIdHeaders = false;
        this.enableOfflineDocs = false;
        this.runner = '';

        // 环境变量
        this.envVllmMaxAudioClipFilesizeMb = 25;
        this.envVllmNoUsageStats = false;
        this.envVllmUsageStatsEnabled = false;
        this.envVllmTestIpcPath = undefined;
        this.envVllmConfigFile = undefined;
        this.envVllmAllowRemoteCode = false;

        // 模型搜索
        this.modelscopeSearchQuery = '';
        this.modelscopeSearchResults = [];
        this.modelscopeLoading = false;
        this.modelscopeError = '';
    }

    /**
     * 搜索 ModelScope 模型（支持分页和排序）
     */
    async searchModelscope(
        query: string,
        page: number = 1,
        pageSize: number = 20,
        sortBy: string = 'downloads',
        endpoint: string = '/api/huggingface/search'
    ): Promise<any[]> {
        this.modelscopeSearchQuery = query;
        this.modelscopeLoading = true;
        this.modelscopeError = '';
        this.modelscopePage = page;
        this.modelscopePageSize = pageSize;

        try {
            const response = await fetch(`http://localhost:8000${endpoint}?page=${page}&page_size=${pageSize}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, page, page_size: pageSize, sort_by: sortBy }),
            }).catch(() => null);

            if (response && response.ok) {
                const data = await response.json();
                this.modelscopeSearchResults = data.results || [];
                this.modelscopeTotal = data.total || 0;
                this.modelscopeTotalPages = data.total_pages || 0;
                // 搜索成功
            } else {
                this.modelscopeSearchResults = [];
                this.modelscopeTotal = 0;
                this.modelscopeTotalPages = 0;
                // 后端不可用
            }
            return this.modelscopeSearchResults;
        } catch (error: any) {
            this.modelscopeError = error.message;
            this.modelscopeSearchResults = [];
            return this.modelscopeSearchResults;
        } finally {
            this.modelscopeLoading = false;
        }
    }

    /**
     * 跳转到指定页
     */
    async goToModelscopePage(page: number): Promise<any[]> {
        if (page < 1 || page > this.modelscopeTotalPages) {
            return this.modelscopeSearchResults;
        }
        return this.searchModelscope(this.modelscopeSearchQuery, page, this.modelscopePageSize);
    }

    /**
     * 加载下一页
     */
    async nextModelscopePage(): Promise<any[]> {
        return this.goToModelscopePage(this.modelscopePage + 1);
    }

    /**
     * 加载上一页
     */
    async prevModelscopePage(): Promise<any[]> {
        return this.goToModelscopePage(this.modelscopePage - 1);
    }

    /**
     * 获取 ModelScope 模型详情
     */
    async getModelscopeDetail(modelId: string): Promise<any> {
        try {
            const response = await fetch(`/api/modelscope/detail?modelId=${encodeURIComponent(modelId)}`);
            if (!response.ok) {
                throw new Error('获取详情失败');
            }
            return await response.json();
        } catch (error: any) {
            console.error('获取模型详情失败:', error);
            return null;
        }
    }

    /**
     * 选择 ModelScope 模型并获取配置
     */
    async selectModel(modelId: string): Promise<void> {
        this.model = modelId;
        console.log('已选择模型:', modelId);
        
        // 获取模型配置
        await this.loadModelConfig(modelId);
    }
    
    /**
     * 加载模型配置文件
     */
    async loadModelConfig(modelId: string): Promise<void> {
        try {
            // 暂时禁用配置获取，避免错误提示
            // const response = await fetch(`http://localhost:8000/api/modelscope/config?modelId=${encodeURIComponent(modelId)}`);
            // if (response.ok) {
            //     const config = await response.json();
            //     this.applyModelConfig(config);
            // }
        } catch (error) {
            // 忽略错误
        }
    }
    
    /**
     * 应用模型配置约束
     */
    applyModelConfig(config: any): void {
        if (!config) return;
        
        // 从 config.json 中提取上下文长度（支持多种字段名）
        const maxPositionEmbeddings = 
            config.max_position_embeddings || 
            config.max_sequence_length || 
            config.model_max_length || 
            config.seq_length || 
            config.n_positions || 
            0;
        
        // 其他配置
        const hiddenSize = config.hidden_size || 0;
        const numAttentionHeads = config.num_attention_heads || 0;
        const numHiddenLayers = config.num_hidden_layers || 0;
        const vocabSize = config.vocab_size || 0;
        
        // 计算模型原始大小（GB）
        // 模型大小 ≈ 参数量 × 2 bytes (FP16)
        const paramCount = hiddenSize * hiddenSize * numHiddenLayers * 2  // 主要权重
                         + hiddenSize * vocabSize;  // 嵌入层
        const rawSizeGB = (paramCount * 2) / (1024 * 1024 * 1024);
        
        if (maxPositionEmbeddings > 0) {
            this.modelMaxPositionEmbeddings = maxPositionEmbeddings;
            // 如果当前最大模型长度超过限制，自动调整
            if (this.maxModelLen > maxPositionEmbeddings) {
                this.maxModelLen = maxPositionEmbeddings;
            }
        }
        
        if (hiddenSize > 0) this.modelHiddenSize = hiddenSize;
        if (numAttentionHeads > 0) this.modelNumAttentionHeads = numAttentionHeads;
        if (numHiddenLayers > 0) this.modelNumHiddenLayers = numHiddenLayers;
        if (vocabSize > 0) this.modelVocabSize = vocabSize;
        if (rawSizeGB > 0) this.modelRawSize = parseFloat(rawSizeGB.toFixed(1));
        
        this.modelConfigLoaded = true;
        console.log('模型配置已加载:', {
            maxPositionEmbeddings,
            hiddenSize,
            numAttentionHeads,
            numHiddenLayers,
            vocabSize,
            rawSizeGB: parseFloat(rawSizeGB.toFixed(1))
        });
    }
}

// 创建全局单例
export const configStore = new ConfigStore();
