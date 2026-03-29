<template>
  <div class="build-form">
    <div v-if="error" class="error-message">{{ error }}</div>
    <div v-if="success" class="success-message">{{ success }}</div>
    
    <CategorySection title="General Build Options">
      <ToggleSwitch v-model="form.buildSharedLibs" name="Build Shared Libraries" description="Build shared libraries instead of static" />
      
      <SelectDropdown
        v-model="form.cmakeBuildType"
        label="CMake Build Type"
        :options="cmakeBuildTypes"
        tooltip={
          {
            title: 'CMAKE_BUILD_TYPE',
            description: 'Specifies the build type for CMake',
            recommended: 'Release for production, Debug for development',
            example: '-DCMAKE_BUILD_TYPE=Release'
          }
        }
      />
      
      <ToggleSwitch v-model="form.ggmlCcache" name="Enable ccache" description="Use ccache for faster incremental builds" />
      <ToggleSwitch v-model="form.ggmlLto" name="Enable LTO" description="Link-time optimization for better performance" />
      <ToggleSwitch v-model="form.ggmlNative" name="Optimize for native CPU" description="Enable -march=native and -mtune=native flags" />
      
      <NumberInput
        v-model="form.cmakeCudaArchitectures"
        label="CUDA Architectures"
        hint="Comma-separated list (e.g., 70, 75, 86)"
      />
    </CategorySection>
    
    <CategorySection title="Backend Options">
      <ToggleSwitch v-model="form.ggmlCuda" name="CUDA Backend" description="NVIDIA GPU acceleration" />
      <ToggleSwitch v-model="form.ggmlHip" name="HIP Backend" description="AMD GPU acceleration" />
      <ToggleSwitch v-model="form.ggmlVulkan" name="Vulkan Backend" description="Cross-platform GPU acceleration" />
      <ToggleSwitch v-model="form.ggmlMetal" name="Metal Backend" description="Apple GPU acceleration (macOS)" />
      <ToggleSwitch v-model="form.ggmlOpencl" name="OpenCL Backend" description="OpenCL GPU acceleration" />
      <ToggleSwitch v-model="form.ggmlBlast" name="BLAS Backend" description="CPU acceleration using BLAS libraries" />
      
      <SelectDropdown
        v-if="form.ggmlBlast"
        v-model="form.ggmlBlastVendor"
        label="BLAS Vendor"
        :options="blasVendors"
        tooltip={
          {
            title: 'GGML_BLAS_VENDOR',
            description: 'Select the BLAS library vendor',
            recommended: 'OpenBLAS for general use, MKL for Intel CPUs',
            example: '-DGGML_BLAS_VENDOR=OpenBLAS'
          }
        }
      />
      
      <ToggleSwitch v-model="form.ggmlCann" name="CANN Backend" description="Huawei Ascend NPU acceleration" />
      <ToggleSwitch v-model="form.ggmlZendnn" name="ZenDNN Backend" description="Intel CPU optimization" />
      <ToggleSwitch v-model="form.ggmlKleidiai" name="KleidiAI Backend" description="Arm CPU acceleration" />
    </CategorySection>
    
    <CategorySection title="CUDA-Specific Options">
      <ToggleSwitch v-if="form.ggmlCuda" v-model="form.ggmlCuda" name="CUDA Backend" description="Required for CUDA options" />
      
      <NumberInput
        v-if="form.ggmlCuda"
        v-model="form.ggmlCudaPeerMaxBatchSize"
        label="Peer Max Batch Size"
        :min="0"
        :max="1024"
        hint="Multi-GPU peer access batch size"
        tooltip={
          {
            title: 'GGML_CUDA_PEER_MAX_BATCH_SIZE',
            description: 'Controls batch size for multi-GPU peer access',
            recommended: '256 for 2 GPUs, 512 for 3+ GPUs',
            example: '-DGGML_CUDA_PEER_MAX_BATCH_SIZE=256'
          }
        }
      />
      
      <ToggleSwitch v-if="form.ggmlCuda" v-model="form.ggmlCudaFa" name="Flash Attention" description="Enable Flash Attention for faster attention" />
      <ToggleSwitch v-if="form.ggmlCuda" v-model="form.ggmlCudaGraphs" name="CUDA Graphs" description="Enable CUDA graphs for reduced overhead" />
      <ToggleSwitch v-if="form.ggmlCuda" v-model="form.ggmlCudaForceMmq" name="Force MMQ" description="Force use of matrix multiplication kernels" />
      <ToggleSwitch v-if="form.ggmlCuda" v-model="form.ggmlCudaForceCublas" name="Force cuBLAS" description="Force usage of cuBLAS library" />
    </CategorySection>
    
    <CategorySection title="Environment Variables">
      <NumberInput
        v-model="form.envVars.CUDACXX"
        label="NVCC Path"
        placeholder="/usr/local/cuda/bin/nvcc"
        hint="Path to NVIDIA CUDA compiler"
        tooltip={
          {
            title: 'CUDACXX',
            description: 'Path to the nvcc compiler',
            recommended: '/usr/local/cuda/bin/nvcc',
            example: 'export CUDACXX=/usr/local/cuda/bin/nvcc'
          }
        }
      />
      
      <ToggleSwitch v-model="form.envVars.GGML_CUDA_ENABLE_UNIFIED_MEMORY" name="Unified Memory" description="Enable unified memory for CUDA" />
      
      <NumberInput
        v-model="form.envVars.OMP_NUM_THREADS"
        label="OpenMP Threads"
        :min="1"
        hint="Number of CPU threads for OpenMP"
        tooltip={
          {
            title: 'OMP_NUM_THREADS',
            description: 'Controls number of CPU threads',
            recommended: 'Number of physical cores',
            example: 'export OMP_NUM_THREADS=8'
          }
        }
      />
      
      <NumberInput
        v-model="form.envVars.CCACHE_DIR"
        label="Ccache Directory"
        placeholder="/tmp/ccache"
        hint="Directory for ccache storage"
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
  buildSharedLibs: false,
  cmakeBuildType: 'RelWithDebInfo',
  ggmlCcache: true,
  ggmlLto: true,
  ggmlNative: true,
  cmakeCudaArchitectures: '',
  
  ggmlCuda: true,
  ggmlHip: false,
  ggmlVulkan: false,
  ggmlMetal: false,
  ggmlOpencl: false,
  ggmlBlast: true,
  ggmlBlastVendor: 'OpenBLAS',
  ggmlCann: false,
  ggmlZendnn: false,
  ggmlKleidiai: false,
  
  ggmlCudaPeerMaxBatchSize: 256,
  ggmlCudaFa: true,
  ggmlCudaGraphs: true,
  ggmlCudaForceMmq: false,
  ggmlCudaForceCublas: false,
  
  envVars: {
    CUDACXX: '/usr/local/cuda/bin/nvcc',
    GGML_CUDA_ENABLE_UNIFIED_MEMORY: true,
    OMP_NUM_THREADS: '',
    CCACHE_DIR: ''
  }
})

const cmakeBuildTypes = [
  { value: 'Debug', label: 'Debug' },
  { value: 'Release', label: 'Release' },
  { value: 'RelWithDebInfo', label: 'RelWithDebInfo' },
  { value: 'MinSizeRel', label: 'MinSizeRel' }
]

const blasVendors = [
  { value: 'Generic', label: 'Generic' },
  { value: 'ATLAS', label: 'ATLAS' },
  { value: 'BLIS', label: 'BLIS' },
  { value: 'OpenBLAS', label: 'OpenBLAS' },
  { value: 'MKL', label: 'MKL' },
  { value: 'ONEAPI', label: 'ONEAPI' }
]

async function previewScript() {
  try {
    const response = await fetch('/api/scripts/build', {
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
    const response = await fetch('/api/configs/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: `Build Config ${new Date().toLocaleString()}`,
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
    buildSharedLibs: false,
    cmakeBuildType: 'RelWithDebInfo',
    ggmlCcache: true,
    ggmlLto: true,
    ggmlNative: true,
    cmakeCudaArchitectures: '',
    ggmlCuda: true,
    ggmlHip: false,
    ggmlVulkan: false,
    ggmlMetal: false,
    ggmlOpencl: false,
    ggmlBlast: true,
    ggmlBlastVendor: 'OpenBLAS',
    ggmlCann: false,
    ggmlZendnn: false,
    ggmlKleidiai: false,
    ggmlCudaPeerMaxBatchSize: 256,
    ggmlCudaFa: true,
    ggmlCudaGraphs: true,
    ggmlCudaForceMmq: false,
    ggmlCudaForceCublas: false,
    envVars: {
      CUDACXX: '/usr/local/cuda/bin/nvcc',
      GGML_CUDA_ENABLE_UNIFIED_MEMORY: true,
      OMP_NUM_THREADS: '',
      CCACHE_DIR: ''
    }
  })
  error.value = ''
  success.value = ''
}
</script>

<style scoped>
.build-form {
  max-width: 900px;
}
</style>
