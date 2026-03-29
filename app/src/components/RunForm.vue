<template>
  <div class="run-form">
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
    
    <CategorySection title="Model Loading">
      <NumberInput
        v-model="form.modelPath"
        label="Model Path"
        placeholder="./models/model.gguf"
        hint="Path to the GGUF model file"
        tooltip={
          {
            title: '-m, --model',
            description: 'Path to the model file',
            recommended: 'Use absolute path for reliability',
            example: '-m ./models/qwen-7b.gguf'
          }
        }
      />
      
      <NumberInput
        v-model="form.gpuLayers"
        label="GPU Layers"
        hint="Number of layers to offload to GPU (use 'all' for all)"
        tooltip={
          {
            title: '-ngl, --gpu-layers',
            description: 'Number of model layers to offload to GPU',
            recommended: 'Use all for single GPU, or calculate based on VRAM',
            example: '-ngl 99'
          }
        }
      />
      
      <ToggleSwitch v-model="form.mlock" name="Force Memory Lock" description="Force model into RAM" />
      <ToggleSwitch v-model="form.mmap" name="Memory Map" description="Enable memory mapping for model" />
      <ToggleSwitch v-model="form.directIo" name="Direct IO" description="Use DirectIO for faster file access" />
      
      <SelectDropdown
        v-model="form.numa"
        label="NUMA Mode"
        :options="numaModes"
        tooltip={
          {
            title: '--numa',
            description: 'NUMA optimization mode',
            recommended: 'spread for multi-socket systems',
            example: '--numa spread'
          }
        }
      />
      
      <NumberInput
        v-model="form.loraPath"
        label="LoRA Adapter Path"
        placeholder="./models/lora.gguf"
        hint="Path to LoRA adapter file"
      />
      
      <NumberInput
        v-model="form.mmprojPath"
        label="MMProj Path"
        placeholder="./models/mmproj.gguf"
        hint="Path to multimodal projector file"
      />
    </CategorySection>
    
    <CategorySection title="Context and Performance">
      <NumberInput
        v-model="form.contextSize"
        label="Context Size"
        :min="128"
        :max="262144"
        hint="Maximum context size (tokens)"
        tooltip={
          {
            title: '-c, --ctx-size',
            description: 'Size of the context window',
            recommended: '4096 for general, 131072 for long context',
            example: '-c 4096'
          }
        }
      />
      
      <NumberInput
        v-model="form.threads"
        label="CPU Threads"
        :min="1"
        hint="Number of CPU threads"
        tooltip={
          {
            title: '-t, --threads',
            description: 'Number of CPU threads to use',
            recommended: 'Number of physical cores',
            example: '-t 8'
          }
        }
      />
      
      <NumberInput
        v-model="form.threadsBatch"
        label="Batch Threads"
        :min="1"
        hint="Threads for batch processing"
      />
      
      <NumberInput
        v-model="form.batchSize"
        label="Batch Size"
        :min="1"
        hint="Logical batch size"
        tooltip={
          {
            title: '-b, --batch-size',
            description: 'Logical batch size for processing',
            recommended: '512 for general use',
            example: '-b 512'
          }
        }
      />
      
      <NumberInput
        v-model="form.ubatchSize"
        label="UBatch Size"
        :min="1"
        hint="Physical batch size"
      />
      
      <ToggleSwitch v-model="form.contBatching" name="Continuous Batching" description="Enable continuous batching for better throughput" />
      <ToggleSwitch v-model="form.kvUnified" name="Unified KV Cache" description="Use unified KV buffer" />
      <ToggleSwitch v-model="form.flashAttn" name="Flash Attention" description="Enable Flash Attention for faster attention" />
      
      <SelectDropdown
        v-model="form.cacheTypeK"
        label="KV Cache K Type"
        :options="cacheTypes"
        tooltip={
          {
            title: '--cache-type-k',
            description: 'Data type for K cache',
            recommended: 'f16 for best quality, q8_0 for memory efficiency',
            example: '--cache-type-k q8_0'
          }
        }
      />
      
      <SelectDropdown
        v-model="form.cacheTypeV"
        label="KV Cache V Type"
        :options="cacheTypes"
        tooltip={
          {
            title: '--cache-type-v',
            description: 'Data type for V cache',
            recommended: 'f16 for best quality, q8_0 for memory efficiency',
            example: '--cache-type-v q8_0'
          }
        }
      />
    </CategorySection>
    
    <CategorySection title="Multi-GPU Configuration">
      <SelectDropdown
        v-model="form.splitMode"
        label="Split Mode"
        :options="splitModes"
        tooltip={
          {
            title: '--split-mode',
            description: 'How to split model across GPUs',
            recommended: 'layer for most cases, row for attention layers',
            example: '--split-mode layer'
          }
        }
      />
      
      <NumberInput
        v-model="form.tensorSplit"
        label="Tensor Split"
        hint="Comma-separated ratios per GPU (e.g., 16,12,12)"
        tooltip={
          {
            title: '--tensor-split',
            description: 'Split ratios for each GPU',
            recommended: 'Match GPU VRAM ratios',
            example: '--tensor-split 16,12,12'
          }
        }
      />
      
      <NumberInput
        v-model="form.mainGpu"
        label="Main GPU"
        :min="0"
        hint="Index of main GPU"
        tooltip={
          {
            title: '--main-gpu',
            description: 'Main GPU for operations',
            recommended: '0 for primary GPU',
            example: '--main-gpu 0'
          }
        }
      />
    </CategorySection>
    
    <CategorySection title="Sampling Parameters">
      <NumberInput
        v-model="form.temperature"
        label="Temperature"
        :min="0"
        :max="2"
        :step="0.01"
        hint="Controls randomness (lower = more deterministic)"
        tooltip={
          {
            title: '--temp, --temperature',
            description: 'Controls randomness of output',
            recommended: '0.7 for general, 0.3 for factual',
            example: '--temp 0.7'
          }
        }
      />
      
      <NumberInput
        v-model="form.topK"
        label="Top-K"
        :min="1"
        :max="100"
        hint="Limit sampling to top K tokens"
        tooltip={
          {
            title: '--top-k',
            description: 'Limit sampling to top K tokens',
            recommended: '40 for general use',
            example: '--top-k 40'
          }
        }
      />
      
      <NumberInput
        v-model="form.topP"
        label="Top-P"
        :min="0"
        :max="1"
        :step="0.01"
        hint="Nucleus sampling threshold"
        tooltip={
          {
            title: '--top-p',
            description: 'Nucleus sampling threshold',
            recommended: '0.95 for balanced output',
            example: '--top-p 0.95'
          }
        }
      />
      
      <NumberInput
        v-model="form.minP"
        label="Min-P"
        :min="0"
        :max="1"
        :step="0.01"
        hint="Minimum probability threshold"
      />
      
      <NumberInput
        v-model="form.typicalP"
        label="Typical-P"
        :min="0"
        :max="1"
        :step="0.01"
        hint="Locally typical sampling parameter"
      />
      
      <NumberInput
        v-model="form.repeatLastN"
        label="Repeat Last N"
        :min="0"
        hint="Window size for repeat penalty"
        tooltip={
          {
            title: '--repeat-last-n',
            description: 'Number of tokens to consider for repeat penalty',
            recommended: '64 for most cases',
            example: '--repeat-last-n 64'
          }
        }
      />
      
      <NumberInput
        v-model="form.repeatPenalty"
        label="Repeat Penalty"
        :min="0"
        :max="2"
        :step="0.01"
        hint="Penalty for repeated tokens"
        tooltip={
          {
            title: '--repeat-penalty',
            description: 'Penalty applied to repeated tokens',
            recommended: '1.1 for slight penalty',
            example: '--repeat-penalty 1.1'
          }
        }
      />
      
      <NumberInput
        v-model="form.presencePenalty"
        label="Presence Penalty"
        :min="-2"
        :max="2"
        :step="0.01"
        hint="Penalty for existing tokens"
      />
      
      <NumberInput
        v-model="form.frequencyPenalty"
        label="Frequency Penalty"
        :min="-2"
        :max="2"
        :step="0.01"
        hint="Penalty for frequent tokens"
      />
      
      <SelectDropdown
        v-model="form.mirostat"
        label="Mirostat Mode"
        :options="mirostatModes"
        tooltip={
          {
            title: '--mirostat',
            description: 'Mirostat sampling mode',
            recommended: '2 for best results',
            example: '--mirostat 2'
          }
        }
      />
      
      <NumberInput
        v-model="form.grammar"
        label="Grammar"
        placeholder="json_schema"
        hint="Grammar constraint for output"
      />
      
      <NumberInput
        v-model="form.jsonSchema"
        label="JSON Schema"
        placeholder='{"type":"object"}'
        hint="JSON schema for structured output"
      />
    </CategorySection>
    
    <CategorySection title="Server Configuration">
      <NumberInput
        v-model="form.host"
        label="Host"
        placeholder="0.0.0.0"
        hint="Server bind address"
        tooltip={
          {
            title: '--host',
            description: 'Server bind address',
            recommended: '0.0.0.0 for all interfaces',
            example: '--host 0.0.0.0'
          }
        }
      />
      
      <NumberInput
        v-model="form.port"
        label="Port"
        :min="1"
        :max="65535"
        hint="Server port number"
        tooltip={
          {
            title: '--port',
            description: 'Server port',
            recommended: '11434 for Ollama compatibility',
            example: '--port 11434'
          }
        }
      />
      
      <NumberInput
        v-model="form.parallel"
        label="Parallel Slots"
        :min="1"
        hint="Number of parallel processing slots"
        tooltip={
          {
            title: '--parallel',
            description: 'Number of concurrent request slots',
            recommended: '4 for general use',
            example: '--parallel 4'
          }
        }
      />
      
      <ToggleSwitch v-model="form.webui" name="Web UI" description="Enable built-in web interface" />
      
      <NumberInput
        v-model="form.apiKey"
        label="API Key"
        placeholder="your-api-key"
        hint="API key for authentication"
      />
      
      <ToggleSwitch v-model="form.metrics" name="Metrics" description="Enable Prometheus metrics" />
      
      <NumberInput
        v-model="form.timeout"
        label="Timeout"
        :min="0"
        hint="Server timeout in seconds"
      />
    </CategorySection>
    
    <CategorySection title="Environment Variables">
      <NumberInput
        v-model="form.envVars.LLAMA_CACHE"
        label="Model Cache Directory"
        placeholder="./cache"
        hint="Directory for model caching"
        tooltip={
          {
            title: 'LLAMA_CACHE',
            description: 'Directory for KV cache',
            recommended: './cache',
            example: 'export LLAMA_CACHE=./cache'
          }
        }
      />
      
      <ToggleSwitch v-model="form.envVars.GGML_CUDA_ENABLE_UNIFIED_MEMORY" name="Unified Memory" description="Enable unified memory for CUDA" />
      
      <NumberInput
        v-model="form.envVars.CUDA_VISIBLE_DEVICES"
        label="CUDA Visible Devices"
        placeholder="0,1"
        hint="Comma-separated GPU indices"
      />
    </CategorySection>
    
    <div class="btn-group">
      <button @click="previewScript" class="btn btn-primary">Preview Script</button>
      <button @click="saveConfig" class="btn btn-secondary">Save Configuration</button>
      <button @click="resetForm" class="btn btn-secondary">Reset</button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import CategorySection from './common/CategorySection.vue'
import ToggleSwitch from './common/ToggleSwitch.vue'
import SelectDropdown from './common/SelectDropdown.vue'
import NumberInput from './common/NumberInput.vue'

const emit = defineEmits(['preview', 'saved'])

const error = ref('')
const success = ref('')

const form = reactive({
  modelPath: './models/model.gguf',
  gpuLayers: 99,
  mlock: false,
  mmap: true,
  directIo: false,
  numa: 'off',
  loraPath: '',
  mmprojPath: '',
  
  contextSize: 4096,
  threads: 8,
  threadsBatch: '',
  batchSize: 512,
  ubatchSize: '',
  contBatching: true,
  kvUnified: false,
  flashAttn: false,
  cacheTypeK: 'f16',
  cacheTypeV: 'f16',
  
  splitMode: 'layer',
  tensorSplit: '',
  mainGpu: 0,
  
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  minP: 0.05,
  typicalP: 1.0,
  repeatLastN: 64,
  repeatPenalty: 1.1,
  presencePenalty: 0.0,
  frequencyPenalty: 0.0,
  mirostat: 2,
  grammar: '',
  jsonSchema: '',
  
  host: '0.0.0.0',
  port: 11434,
  parallel: 4,
  webui: false,
  apiKey: '',
  metrics: false,
  timeout: 0,
  
  envVars: {
    LLAMA_CACHE: './cache',
    GGML_CUDA_ENABLE_UNIFIED_MEMORY: true,
    CUDA_VISIBLE_DEVICES: ''
  }
})

const numaModes = [
  { value: 'off', label: 'Off' },
  { value: 'bind', label: 'Bind' },
  { value: 'spread', label: 'Spread' }
]

const splitModes = [
  { value: 'none', label: 'None' },
  { value: 'layer', label: 'Layer' },
  { value: 'row', label: 'Row' }
]

const cacheTypes = [
  { value: 'f16', label: 'f16 (float16)' },
  { value: 'q8_0', label: 'q8_0' },
  { value: 'q4_0', label: 'q4_0' }
]

const mirostatModes = [
  { value: 0, label: 'Disabled' },
  { value: 1, label: 'Mirostat 1.0' },
  { value: 2, label: 'Mirostat 2.0' }
]

async function previewScript() {
  try {
    const response = await fetch('/api/scripts/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ config: form })
    })
    
    if (!response.ok) {
      throw new Error('Failed to generate script')
    }
    
    const data = await response.json()
    emit('preview', data.script)
  } catch (err) {
    error.value = err.message
  }
}

async function saveConfig() {
  try {
    const response = await fetch('/api/configs/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Run Config ${new Date().toLocaleString()}`,
        config: form
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to save configuration')
    }
    
    success.value = 'Configuration saved successfully!'
    setTimeout(() => { success.value = '' }, 3000)
  } catch (err) {
    error.value = err.message
  }
}

function resetForm() {
  Object.assign(form, {
    modelPath: './models/model.gguf',
    gpuLayers: 99,
    mlock: false,
    mmap: true,
    directIo: false,
    numa: 'off',
    loraPath: '',
    mmprojPath: '',
    contextSize: 4096,
    threads: 8,
    threadsBatch: '',
    batchSize: 512,
    ubatchSize: '',
    contBatching: true,
    kvUnified: false,
    flashAttn: false,
    cacheTypeK: 'f16',
    cacheTypeV: 'f16',
    splitMode: 'layer',
    tensorSplit: '',
    mainGpu: 0,
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    minP: 0.05,
    typicalP: 1.0,
    repeatLastN: 64,
    repeatPenalty: 1.1,
    presencePenalty: 0.0,
    frequencyPenalty: 0.0,
    mirostat: 2,
    grammar: '',
    jsonSchema: '',
    host: '0.0.0.0',
    port: 11434,
    parallel: 4,
    webui: false,
    apiKey: '',
    metrics: false,
    timeout: 0,
    envVars: {
      LLAMA_CACHE: './cache',
      GGML_CUDA_ENABLE_UNIFIED_MEMORY: true,
      CUDA_VISIBLE_DEVICES: ''
    }
  })
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.run-form {
  max-width: 900px;
}
</style>
