# Llama.cpp GUI Manager - Design Document

**Version:** 1.0  
**Date:** March 28, 2026  
**Status:** Draft for Review  

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Application Overview](#application-overview)
3. [Technical Architecture](#technical-architecture)
4. [Feature Requirements](#feature-requirements)
5. [System Requirements](#system-requirements)
6. [Development Phases](#development-phases)
7. [Testing Strategy](#testing-strategy)
8. [Risk Assessment](#risk-assessment)
9. [Appendices](#appendices)

---

## Executive Summary

This design document outlines the development of a modern, minimalist web application for managing llama.cpp build and runtime configurations through a graphical user interface. The application will enable users to create, save, and execute shell scripts for building and launching llama.cpp without manual command-line interaction.

### Key Objectives

- Provide a GUI interface for all llama.cpp build and runtime flags
- Generate and save shell scripts to a designated folder
- Support modern Vue 3 frontend with Express.js backend
- Implement local filesystem-based state storage (no database)
- Include comprehensive tooltips explaining each flag's purpose and impact

### Target Audience

- Developers working with llama.cpp who prefer GUI over CLI
- Users managing multiple model configurations
- Teams standardizing llama.cpp deployment configurations

---

## Application Overview

### Application Name

**Llama Manager** (working title)

### Core Functionality

1. **Build Script Generator**: Create build configurations for llama.cpp compilation
2. **Run Script Generator**: Create runtime configurations for llama-server execution
3. **Script Library**: Save, organize, and retrieve generated scripts
4. **Configuration Management**: Load, modify, and export configurations
5. **Preview and Execute**: Preview generated scripts and execute them directly from the UI

### User Workflows

#### Build Script Workflow
1. User selects hardware configuration (CUDA, CPU, etc.)
2. User configures build options via GUI controls
3. Application generates build.sh script
4. User saves script to library
5. User can execute script directly from UI

#### Run Script Workflow
1. User selects model file
2. User configures runtime parameters (context size, temperature, GPU layers, etc.)
3. User configures hardware settings (tensor split, threads, etc.)
4. Application generates run.sh script
5. User saves script to library
6. User can execute script directly from UI

---

## Technical Architecture

### Technology Stack

#### Frontend
- **Framework**: Vue 3 (Composition API with `<script setup>`)
- **Build Tool**: Vite
- **State Management**: Pinia (for complex state, optional localStorage for simple cases)
- **UI Components**: Custom components with dark mint/white color scheme
- **Styling**: CSS with CSS Variables for theming
- **HTTP Client**: Axios or native Fetch API

#### Backend
- **Runtime**: Node.js (LTS version)
- **Framework**: Express.js
- **File System**: Node.js `fs` module for reading/writing scripts
- **Script Execution**: Node.js `child_process` module
- **API**: RESTful endpoints

#### Storage
- **Type**: Local filesystem (JSON files)
- **Location**: `./app/configs/` within application directory
- **Format**: JSON for configuration metadata, Bash for generated scripts

### Directory Structure

```
/app
├── server.js                    # Express.js server entry point
├── package.json
├── configs/                     # Local storage for configurations
│   ├── build-configs.json
│   ├── run-configs.json
│   └── presets.json
├── scripts/                     # Generated shell scripts
│   ├── builds/
│   └── runs/
├── src/                         # Vue 3 frontend source
│   ├── main.js
│   ├── App.vue
│   ├── components/
│   │   ├── BuildForm.vue
│   │   ├── RunForm.vue
│   │   ├── ScriptLibrary.vue
│   │   ├── Tooltip.vue
│   │   └── common/
│   ├── composables/
│   │   ├── useBuildConfig.js
│   │   ├── useRunConfig.js
│   │   └── useScriptManager.js
│   ├── utils/
│   │   ├── scriptGenerator.js
│   │   └── configValidator.js
│   └── assets/
│       └── styles.css
└── public/                      # Static assets
    └── favicon.ico
```

### API Endpoints

#### Configuration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/configs/build` | Get all build configurations |
| POST | `/api/configs/build` | Create new build configuration |
| PUT | `/api/configs/build/:id` | Update build configuration |
| DELETE | `/api/configs/build/:id` | Delete build configuration |
| GET | `/api/configs/run` | Get all run configurations |
| POST | `/api/configs/run` | Create new run configuration |
| PUT | `/api/configs/run/:id` | Update run configuration |
| DELETE | `/api/configs/run/:id` | Delete run configuration |

#### Script Generation Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/scripts/build` | Generate build script from config |
| POST | `/api/scripts/run` | Generate run script from config |

#### Script Management Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/scripts/list` | List all saved scripts |
| GET | `/api/scripts/:id` | Get script content |
| POST | `/api/scripts/execute` | Execute a script |
| DELETE | `/api/scripts/:id` | Delete a script |

#### Health and Info Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/system-info` | Get system information (GPU count, CPU cores) |

---

## Feature Requirements

### 1. Build Script Generator

#### Build Options Categories

##### General Build Options
- `BUILD_SHARED_LIBS`: Enable/disable shared library build
- `CMAKE_BUILD_TYPE`: Debug/Release build type
- `GGML_CCACHE`: Enable ccache for faster builds
- `GGML_LTO`: Enable link-time optimization
- `GGML_NATIVE`: Optimize for native CPU
- `CMAKE_CUDA_ARCHITECTURES`: Specify CUDA architectures

##### Backend Options
- `GGML_CUDA`: Enable CUDA backend
- `GGML_HIP`: Enable HIP (AMD GPU) backend
- `GGML_VULKAN`: Enable Vulkan backend
- `GGML_METAL`: Enable Metal (macOS) backend
- `GGML_OPENCL`: Enable OpenCL backend
- `GGML_BLAS`: Enable BLAS CPU acceleration
- `GGML_BLAS_VENDOR`: BLAS vendor selection
- `GGML_CANN`: Enable CANN (Ascend NPU) backend
- `GGML_ZENDNN`: Enable ZenDNN (AMD CPU) backend
- `GGML_CPU_KLEIDIAI`: Enable KleidiAI (Arm CPU) backend

##### CUDA-Specific Options
- `GGML_CUDA_PEER_MAX_BATCH_SIZE`: Multi-GPU peer access batch size
- `GGML_CUDA_COMPRESSION_MODE`: CUDA compression mode
- `GGML_CUDA_FA`: Enable Flash Attention for CUDA
- `GGML_CUDA_GRAPHS`: Enable CUDA graphs
- `GGML_CUDA_FORCE_MMQ`: Force matrix multiplication kernels
- `GGML_CUDA_FORCE_CUBLAS`: Force cuBLAS usage
- `GGML_CUDA_FA_ALL_QUANTS`: Enable all quant types for FA

##### Environment Variables
- `CUDACXX`: Path to nvcc compiler
- `GGML_CUDA_ENABLE_UNIFIED_MEMORY`: Enable unified memory
- `CUDA_VISIBLE_DEVICES`: Specify visible GPUs
- `OMP_NUM_THREADS`: OpenMP thread count
- `CCACHE_DIR`: Ccache directory

### 2. Run Script Generator

#### Runtime Options Categories

##### Model Loading
- `-m, --model`: Model file path
- `-ngl, --gpu-layers`: Number of layers to offload to GPU
- `--mlock`: Force model into RAM
- `--mmap`: Enable memory mapping
- `--direct-io`: Use DirectIO
- `--numa`: NUMA optimization mode
- `--override-tensor`: Override tensor buffer types
- `--lora`: Load LoRA adapter
- `--mmproj`: Multimodal projector file

##### Context and Performance
- `-c, --ctx-size`: Context size
- `-t, --threads`: CPU thread count
- `-tb, --threads-batch`: Batch thread count
- `-b, --batch-size`: Logical batch size
- `-ub, --ubatch-size`: Physical batch size
- `--cont-batching`: Enable continuous batching
- `--kv-unified`: Use unified KV buffer
- `--flash-attn`: Enable Flash Attention
- `--cache-type-k`: KV cache K type
- `--cache-type-v`: KV cache V type

##### Multi-GPU Configuration
- `-sm, --split-mode`: Split mode (none/layer/row)
- `-ts, --tensor-split`: GPU tensor split ratios
- `-mg, --main-gpu`: Main GPU index
- `CUDA_SCALE_LAUNCH_QUEUES`: CUDA launch queue scaling

##### Sampling Parameters
- `--temp, --temperature`: Temperature value
- `--top-k`: Top-K sampling
- `--top-p`: Top-P (nucleus) sampling
- `--min-p`: Min-P sampling
- `--typical, --typical-p`: Locally typical sampling
- `--repeat-last-n`: Repeat penalty window
- `--repeat-penalty`: Repeat penalty value
- `--presence-penalty`: Presence penalty
- `--frequency-penalty`: Frequency penalty
- `--mirostat`: Mirostat sampling mode
- `--grammar`: Grammar constraint
- `--json-schema`: JSON schema constraint

##### Server Configuration
- `--host`: Server bind address
- `--port`: Server port
- `--parallel`: Number of server slots
- `--webui`: Enable web UI
- `--api-key`: API key for authentication
- `--metrics`: Enable Prometheus metrics
- `--timeout`: Server timeout

##### Environment Variables
- `LLAMA_CACHE`: Model cache directory
- `CUDA_SCALE_LAUNCH_QUEUES`: CUDA queue scaling
- `GGML_CUDA_ENABLE_UNIFIED_MEMORY`: Unified memory
- `CUDACXX`: NVCC path
- `HIP_VISIBLE_DEVICES`: HIP visible devices
- `LLAMA_ARG_*`: Various llama.cpp args as env vars

### 3. UI Components

#### Form Components
- **BuildForm.vue**: Build configuration form
- **RunForm.vue**: Run configuration form
- **ScriptLibrary.vue**: Script library view
- **ScriptPreview.vue**: Script content preview

#### Common Components
- **Tooltip.vue**: Reusable tooltip component
- **CategorySection.vue**: Collapsible section for options
- **ToggleSwitch.vue**: Boolean toggle control
- **NumberInput.vue**: Number input with validation
- **SelectDropdown.vue**: Dropdown selection
- **FilePicker.vue**: File path picker
- **MultiSelect.vue**: Multi-select control

#### Layout Components
- **Header.vue**: Application header
- **Sidebar.vue**: Navigation sidebar
- **MainContent.vue**: Main content area
- **Modal.vue**: Modal dialog

### 4. Color Scheme

#### Dark Mint and White Theme

```css
:root {
  /* Primary Colors */
  --color-mint-dark: #2E5C55;
  --color-mint: #5A9A8F;
  --color-mint-light: #8CC7B9;
  --color-mint-accent: #B8E0D6;
  
  /* Neutral Colors */
  --color-white: #FFFFFF;
  --color-off-white: #F5F7F6;
  --color-gray-light: #E8EDEB;
  --color-gray: #8FA39E;
  --color-gray-dark: #5A6E69;
  --color-black: #1A2624;
  
  /* Functional Colors */
  --color-success: #4CAF50;
  --color-warning: #FF9800;
  --color-error: #F44336;
  --color-info: #2196F3;
  
  /* Background Colors */
  --bg-primary: #1A2624;
  --bg-secondary: #2E3A38;
  --bg-tertiary: #3D4A47;
  
  /* Text Colors */
  --text-primary: #FFFFFF;
  --text-secondary: #E8EDEB;
  --text-muted: #8FA39E;
  
  /* Border Colors */
  --border-light: #3D4A47;
  --border-medium: #5A6E69;
  
  /* Semantic Colors */
  --color-highlight: #5A9A8F;
  --color-focus: #8CC7B9;
}
```

### 5. Tooltip System

Each configuration option includes:
- **Description**: What the option does
- **Impact**: How it affects performance or behavior
- **Recommended Values**: Suggested values for common scenarios
- **Example**: Usage example

Example tooltip content:
```
--temp, --temperature
Controls the randomness of text generation.
Lower values (0.1-0.5) make output more deterministic and focused.
Higher values (0.7-1.0) make output more creative and varied.
Recommended: 0.7 for general use, 0.3 for factual queries
```

---

## System Requirements

### Development Environment

- **Node.js**: 18.x or later (LTS)
- **npm**: 9.x or later
- **Git**: For version control
- **Code Editor**: VS Code or similar

### Production Environment

- **Node.js**: 18.x LTS or later
- **Operating System**: Linux, macOS, Windows
- **Memory**: 8GB RAM minimum, 16GB recommended
- **Disk**: 10GB free space for application and scripts

### Hardware Requirements (for llama.cpp execution)

- **GPU (Recommended)**: NVIDIA GPU with CUDA support (8GB+ VRAM)
- **CPU**: 4+ cores, modern architecture
- **Memory**: 16GB+ RAM for large models

---

## Development Phases

### Phase 1: Project Setup and Foundation

**Duration**: 1-2 weeks  
**Goal**: Establish project structure and basic infrastructure

#### Milestone 1.1: Project Initialization

**Todo List:**

1. Create project directory structure
   - Set up `/app` folder with subdirectories
   - Create initial `package.json`
   - Configure ESLint and Prettier

2. Initialize Vue 3 project with Vite
   - Install Vue 3 dependencies
   - Configure Vite build settings
   - Set up development server

3. Set up Express.js backend
   - Install Express.js and dependencies
   - Create initial server.js file
   - Configure middleware (CORS, JSON parsing)
   - Set up basic route structure

4. Configure file system storage
   - Create `configs/` directory
   - Create `scripts/` directory with subdirectories
   - Initialize configuration JSON files
   - Set up file reading/writing utilities

5. Create basic routing
   - Set up frontend serving from Express
   - Configure API routes structure
   - Add health check endpoint

6. Set up version control
   - Initialize Git repository (if not already)
   - Create `.gitignore` for app directory
   - Add initial commit

#### Milestone 1.2: Core Infrastructure

**Todo List:**

1. Create base Vue components
   - Implement `Tooltip.vue` component
   - Implement `CategorySection.vue` component
   - Implement `ToggleSwitch.vue` component
   - Implement `NumberInput.vue` component
   - Implement `SelectDropdown.vue` component

2. Set up state management
   - Install Pinia (or configure localStorage)
   - Create store for build configurations
   - Create store for run configurations
   - Implement state persistence

3. Create API service layer
   - Create HTTP client wrapper
   - Implement API service for configurations
   - Implement API service for scripts
   - Add error handling

4. Set up styling system
   - Create CSS variables file
   - Implement base styles
   - Create utility classes
   - Set up responsive design foundation

5. Create layout components
   - Implement `Header.vue` component
   - Implement `Sidebar.vue` component
   - Implement `MainContent.vue` component
   - Set up navigation routing

6. Add form validation
   - Create validation utilities
   - Implement field-level validation
   - Add error message display
   - Create validation rules for common fields

---

### Phase 2: Build Script Generator

**Duration**: 2-3 weeks  
**Goal**: Complete build script generation functionality

#### Milestone 2.1: Build Form Interface

**Todo List:**

1. Create `BuildForm.vue` component
   - Set up form structure
   - Implement form state management
   - Add validation hooks

2. Implement General Build Options section
   - Create input for BUILD_SHARED_LIBS (toggle)
   - Create dropdown for CMAKE_BUILD_TYPE
   - Create toggle for GGML_CCACHE
   - Create toggle for GGML_LTO
   - Create toggle for GGML_NATIVE
   - Create multi-select for CMAKE_CUDA_ARCHITECTURES
   - Add tooltips for each option

3. Implement Backend Options section
   - Create toggles for each backend (CUDA, HIP, Vulkan, etc.)
   - Create dropdown for BLAS vendor
   - Add conditional visibility for backend-specific options
   - Add tooltips for each option

4. Implement CUDA-specific Options section
   - Create number inputs for CUDA options
   - Create dropdowns for CUDA modes
   - Add toggles for CUDA features
   - Add tooltips with performance impact descriptions

5. Implement Environment Variables section
   - Create text inputs for variable values
   - Add preset buttons for common configurations
   - Create custom variable adder
   - Add tooltips explaining each variable

6. Add form actions
   - Implement preview script button
   - Implement save configuration button
   - Implement reset form button
   - Add confirmation dialogs for destructive actions

#### Milestone 2.2: Build Script Generation

**Todo List:**

1. Create script generator utility
   - Implement build script template
   - Create function to convert config to script
   - Add variable interpolation
   - Add comments to generated script

2. Implement backend API endpoint
   - Create POST `/api/scripts/build` endpoint
   - Add script generation logic
   - Add script validation
   - Return generated script content

3. Add script preview functionality
   - Create `ScriptPreview.vue` component
   - Implement syntax highlighting for bash
   - Add copy to clipboard functionality
   - Add download script button

4. Implement script saving
   - Create function to save script to filesystem
   - Generate unique script filenames
   - Add script metadata to configuration
   - Update script library on save

5. Add script execution functionality
   - Create POST `/api/scripts/execute` endpoint
   - Implement script execution via child_process
   - Add streaming output for execution logs
   - Add error handling for execution failures

6. Create build presets
   - Implement preset system for common build configs
   - Add preset selection dropdown
   - Create presets for typical hardware configurations
   - Allow users to save custom presets

---

### Phase 3: Run Script Generator

**Duration**: 3-4 weeks  
**Goal**: Complete run script generation functionality

#### Milestone 3.1: Run Form Interface

**Todo List:**

1. Create `RunForm.vue` component
   - Set up form structure
   - Implement form state management
   - Add validation hooks

2. Implement Model Loading section
   - Create file picker for model path
   - Create number input for GPU layers
   - Create toggles for mlock, mmap, direct-io
   - Create dropdown for NUMA mode
   - Create multi-input for tensor overrides
   - Add file picker for LoRA adapters
   - Add tooltips for each option

3. Implement Context and Performance section
   - Create number input for context size
   - Create number inputs for thread counts
   - Create number inputs for batch sizes
   - Create toggle for continuous batching
   - Create toggle for unified KV buffer
   - Create toggle for Flash Attention
   - Create dropdowns for cache types
   - Add tooltips with performance impact descriptions

4. Implement Multi-GPU Configuration section
   - Create dropdown for split mode
   - Create text input for tensor split (comma-separated)
   - Create number input for main GPU
   - Create text input for CUDA queue scaling
   - Add conditional visibility based on GPU count
   - Add tooltips explaining multi-GPU concepts

5. Implement Sampling Parameters section
   - Create number inputs for temperature, top-k, top-p, min-p
   - Create number input for typical-p
   - Create number inputs for repeat penalties
   - Create dropdown for mirostat mode
   - Create text input for grammar
   - Create text area for JSON schema
   - Add tooltips with sampling strategy recommendations

6. Implement Server Configuration section
   - Create text input for host address
   - Create number input for port
   - Create number input for parallel slots
   - Create toggle for web UI
   - Create text input for API key
   - Create toggle for metrics
   - Create number input for timeout
   - Add tooltips for server options

7. Implement Environment Variables section
   - Create text inputs for common variables
   - Add presets for common environments
   - Create custom variable adder
   - Add tooltips for each variable

8. Add form actions
   - Implement preview script button
   - Implement save configuration button
   - Implement reset form button
   - Add confirmation dialogs for destructive actions

#### Milestone 3.2: Run Script Generation

**Todo List:**

1. Create run script generator utility
   - Implement run script template
   - Create function to convert config to script
   - Add variable interpolation
   - Add comments and documentation to script
   - Include system info detection

2. Implement backend API endpoint
   - Create POST `/api/scripts/run` endpoint
   - Add script generation logic
   - Add script validation
   - Return generated script content

3. Enhance script preview
   - Add run script specific syntax highlighting
   - Include model information display
   - Show estimated VRAM usage
   - Display performance estimates

4. Implement script execution with monitoring
   - Enhance execution endpoint for run scripts
   - Add real-time log streaming
   - Implement process monitoring
   - Add stop/cancel execution functionality
   - Display exit codes and errors

5. Add model information integration
   - Create endpoint to get model metadata
   - Display model size and type in UI
   - Estimate VRAM requirements
   - Show compatible quantization options

6. Create run presets
   - Implement preset system for common run configs
   - Add preset selection dropdown
   - Create presets for different model sizes
   - Create presets for single vs multi-GPU
   - Allow users to save custom presets

---

### Phase 4: Script Library and Management

**Duration**: 2-3 weeks  
**Goal**: Complete script library and management features

#### Milestone 4.1: Script Library Interface

**Todo List:**

1. Create `ScriptLibrary.vue` component
   - Set up library grid/list view
   - Implement search functionality
   - Add filtering by type (build/run)
   - Add sorting options
   - Implement pagination for large libraries

2. Implement script cards
   - Create script card component
   - Display script metadata (name, type, date)
   - Show preview of script content
   - Add quick action buttons (run, edit, delete)
   - Include thumbnail/icon for script type

3. Add library management features
   - Implement rename script functionality
   - Add move script between folders
   - Create bulk delete functionality
   - Add export/import scripts
   - Implement script versioning (optional)

4. Create script details view
   - Implement detailed script view modal
   - Show full script content
   - Display configuration metadata
   - Show execution history
   - Add comparison view (optional)

5. Add favorites and tags
   - Implement favorite script marking
   - Create tag system for scripts
   - Add filtering by tags
   - Implement tag management UI

#### Milestone 4.2: Configuration Management

**Todo List:**

1. Implement configuration CRUD operations
   - Create full create functionality
   - Implement update with validation
   - Add delete with confirmation
   - Implement duplicate configuration

2. Add configuration import/export
   - Create export to JSON functionality
   - Implement import from JSON
   - Add validation for imported configs
   - Handle conflicts during import

3. Implement configuration comparison
   - Create side-by-side comparison view
   - Highlight differences between configs
   - Add merge functionality (optional)
   - Show impact of changes

4. Add configuration history
   - Track configuration changes
   - Implement rollback to previous version
   - Show change history log
   - Add configuration versioning

5. Create collaboration features (optional)
   - Add sharing functionality
   - Implement configuration templates
   - Create team library (optional)
   - Add permission system (optional)

---

### Phase 5: Testing and Quality Assurance

**Duration**: 2-3 weeks  
**Goal**: Comprehensive testing and quality assurance

#### Milestone 5.1: Unit Testing

**Todo List:**

1. Set up testing framework
   - Install Vitest or Jest
   - Configure test environment
   - Set up testing utilities
   - Create test configuration

2. Test utility functions
   - Write tests for script generator
   - Test config validators
   - Test file system utilities
   - Test form validators

3. Test Vue components
   - Write component unit tests
   - Test form validation logic
   - Test state management
   - Test event handlers

4. Test backend endpoints
   - Write API endpoint tests
   - Test script generation logic
   - Test file operations
   - Test error handling

5. Achieve code coverage goals
   - Set coverage thresholds (80%+)
   - Generate coverage reports
   - Address uncovered code paths
   - Document test coverage

#### Milestone 5.2: Integration Testing

**Todo List:**

1. Test build script generation
   - Verify all build options generate correctly
   - Test backend-specific options
   - Test environment variable generation
   - Validate script syntax

2. Test run script generation
   - Verify all runtime options generate correctly
   - Test multi-GPU configurations
   - Test sampling parameter combinations
   - Validate script syntax

3. Test script execution
   - Test build script execution
   - Test run script execution
   - Test error handling during execution
   - Verify log output

4. Test configuration management
   - Test CRUD operations
   - Test import/export functionality
   - Test configuration validation
   - Test persistence

5. Test UI interactions
   - Test form submissions
   - Test navigation flows
   - Test error states
   - Test responsive behavior

#### Milestone 5.3: User Acceptance Testing

**Todo List:**

1. Create UAT test cases
   - Document test scenarios
   - Create test data sets
   - Define success criteria
   - Prepare test environment

2. Conduct usability testing
   - Test with actual users
   - Gather feedback on UI/UX
   - Identify pain points
   - Document issues

3. Performance testing
   - Test with large configurations
   - Test script generation speed
   - Test library performance
   - Measure load times

4. Security testing
   - Test for XSS vulnerabilities
   - Test file path validation
   - Test script execution sandboxing
   - Verify API authentication (if implemented)

5. Documentation testing
   - Verify tooltip accuracy
   - Test help documentation
   - Validate error messages
   - Check user guide completeness

---

### Phase 6: Polish and Deployment

**Duration**: 1-2 weeks  
**Goal**: Final polish and deployment preparation

#### Milestone 6.1: UI/UX Polish

**Todo List:**

1. Refine visual design
   - Review color scheme consistency
   - Adjust spacing and typography
   - Polish animations and transitions
   - Ensure visual hierarchy

2. Improve accessibility
   - Add ARIA labels
   - Test keyboard navigation
   - Verify color contrast ratios
   - Add screen reader support

3. Optimize performance
   - Implement code splitting
   - Add lazy loading
   - Optimize bundle size
   - Implement caching strategies

4. Add loading states
   - Implement skeleton screens
   - Add loading spinners
   - Create progress indicators
   - Add optimistic updates

#### Milestone 6.2: Documentation

**Todo List:**

1. Create user documentation
   - Write getting started guide
   - Document all features
   - Create troubleshooting guide
   - Add FAQ section

2. Create developer documentation
   - Document code structure
   - Explain architecture decisions
   - Document API endpoints
   - Add contribution guidelines

3. Update tooltips and inline help
   - Review all tooltip content
   - Add examples where helpful
   - Verify accuracy
   - Improve clarity

#### Milestone 6.3: Deployment Preparation

**Todo List:**

1. Prepare production build
   - Configure production environment
   - Optimize build settings
   - Set up environment variables
   - Test production build

2. Create deployment scripts
   - Write deployment automation
   - Create rollback procedures
   - Document deployment steps
   - Set up monitoring

3. Set up error tracking
   - Integrate error logging
   - Configure alerting
   - Set up crash reporting
   - Create error dashboards

4. Final security review
   - Conduct security audit
   - Address vulnerabilities
   - Implement security best practices
   - Document security measures

---

## Testing Strategy

### Unit Testing

#### Build Script Generator Tests

```javascript
// Example test structure
describe('BuildScriptGenerator', () => {
  describe('generateBuildScript', () => {
    it('should generate script with CUDA enabled', () => {
      const config = {
        buildSharedLibs: false,
        cmakeBuildType: 'Release',
        ggmlCuda: true,
        ggmlCpu: false
      };
      const script = generateBuildScript(config);
      expect(script).toContain('-DBUILD_SHARED_LIBS=OFF');
      expect(script).toContain('-DCMAKE_BUILD_TYPE=Release');
      expect(script).toContain('-DGGML_CUDA=ON');
    });
    
    it('should include all environment variables', () => {
      const config = {
        envVars: {
          CUDACXX: '/usr/local/cuda/bin/nvcc',
          OMP_NUM_THREADS: '8'
        }
      };
      const script = generateBuildScript(config);
      expect(script).toContain('export CUDACXX=/usr/local/cuda/bin/nvcc');
      expect(script).toContain('export OMP_NUM_THREADS=8');
    });
  });
});
```

#### Run Script Generator Tests

```javascript
describe('RunScriptGenerator', () => {
  describe('generateRunScript', () => {
    it('should generate script with all sampling parameters', () => {
      const config = {
        modelPath: './model.gguf',
        contextSize: 4096,
        temperature: 0.7,
        topK: 40,
        topP: 0.95
      };
      const script = generateRunScript(config);
      expect(script).toContain('-m ./model.gguf');
      expect(script).toContain('-c 4096');
      expect(script).toContain('--temp 0.7');
      expect(script).toContain('--top-k 40');
      expect(script).toContain('--top-p 0.95');
    });
    
    it('should generate multi-GPU configuration', () => {
      const config = {
        splitMode: 'layer',
        tensorSplit: '16,12,12',
        mainGpu: 0
      };
      const script = generateRunScript(config);
      expect(script).toContain('--split-mode layer');
      expect(script).toContain('--tensor-split 16,12,12');
      expect(script).toContain('--main-gpu 0');
    });
  });
});
```

#### Configuration Validator Tests

```javascript
describe('ConfigValidator', () => {
  describe('validateBuildConfig', () => {
    it('should reject invalid CUDA architectures', () => {
      const config = {
        cudaArchitectures: ['99'] // Invalid architecture
      };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid CUDA architecture');
    });
    
    it('should accept valid configuration', () => {
      const config = {
        cmakeBuildType: 'Release',
        ggmlCuda: true
      };
      const result = validateBuildConfig(config);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
```

### Integration Testing

#### End-to-End Test Scenarios

1. **Complete Build Script Flow**
   - User fills out build form
   - User previews generated script
   - User saves configuration
   - User executes script
   - Verify script runs successfully

2. **Complete Run Script Flow**
   - User selects model file
   - User configures runtime parameters
   - User previews generated script
   - User saves configuration
   - User executes script
   - Verify server starts and responds

3. **Configuration Management Flow**
   - User creates configuration
   - User edits configuration
   - User duplicates configuration
   - User exports configuration
   - User imports configuration

4. **Error Handling Scenarios**
   - User enters invalid values
   - User attempts to execute missing script
   - User attempts to delete protected script
   - Verify appropriate error messages

### Manual Testing Checklist

#### Build Script Testing
- [ ] Generate script with minimal options
- [ ] Generate script with all CUDA options
- [ ] Generate script with all BLAS options
- [ ] Verify script syntax with bash -n
- [ ] Execute script in test environment
- [ ] Verify build artifacts created

#### Run Script Testing
- [ ] Generate script with single GPU
- [ ] Generate script with multiple GPUs
- [ ] Generate script with all sampling options
- [ ] Verify script syntax with bash -n
- [ ] Execute script in test environment
- [ ] Verify server responds to API calls
- [ ] Test with different model sizes

#### UI Testing
- [ ] Test all form inputs
- [ ] Test all dropdown selections
- [ ] Test all toggle switches
- [ ] Test tooltip display
- [ ] Test responsive design
- [ ] Test keyboard navigation
- [ ] Test error states

---

## Risk Assessment

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| llama.cpp API changes | Medium | Medium | Regular updates, abstraction layer |
| Script execution security | High | Low | Input validation, sandboxing |
| File system permissions | Medium | Low | Proper error handling, user feedback |
| Performance with large configs | Low | Medium | Lazy loading, pagination |
| Browser compatibility | Low | Low | Modern browser support, polyfills |

### Project Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Scope creep | High | Medium | Strict milestone boundaries |
| Timeline delays | Medium | Medium | Buffer time in estimates |
| Resource constraints | Medium | Low | Clear prioritization |
| Knowledge gaps | Medium | Low | Research phase, documentation |

### Mitigation Strategies

1. **Regular Communication**: Weekly progress reviews
2. **Incremental Delivery**: Deliver working features each phase
3. **Testing Early**: Comprehensive testing throughout development
4. **Documentation**: Maintain up-to-date documentation
5. **Flexibility**: Adjust plan based on findings

---

## Appendices

### Appendix A: Complete Flag Reference

#### Build Flags Summary

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| BUILD_SHARED_LIBS | Boolean | ON | Build shared libraries |
| CMAKE_BUILD_TYPE | Enum | RelWithDebInfo | Build type |
| GGML_CCACHE | Boolean | OFF | Enable ccache |
| GGML_LTO | Boolean | OFF | Enable LTO |
| GGML_CUDA | Boolean | OFF | Enable CUDA backend |
| GGML_HIP | Boolean | OFF | Enable HIP backend |
| GGML_VULKAN | Boolean | OFF | Enable Vulkan backend |
| GGML_METAL | Boolean | ON (macOS) | Enable Metal backend |
| GGML_BLAS | Boolean | OFF | Enable BLAS |
| GGML_BLAS_VENDOR | Enum | Generic | BLAS vendor |

#### Runtime Flags Summary

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| -m, --model | Path | Required | Model file path |
| -c, --ctx-size | Integer | 512 | Context size |
| -t, --threads | Integer | Auto | CPU threads |
| -ngl, --gpu-layers | Integer | Auto | GPU layers |
| --temp, --temperature | Float | 0.8 | Temperature |
| --top-k | Integer | 40 | Top-K |
| --top-p | Float | 0.95 | Top-P |
| --split-mode | Enum | layer | Split mode |
| --tensor-split | String | - | Tensor split |

### Appendix B: Environment Variables Reference

#### Build Environment Variables

| Variable | Description |
|----------|-------------|
| CUDACXX | Path to nvcc compiler |
| CCACHE_DIR | Ccache directory |
| OMP_NUM_THREADS | OpenMP thread count |

#### Runtime Environment Variables

| Variable | Description |
|----------|-------------|
| LLAMA_CACHE | Model cache directory |
| CUDA_VISIBLE_DEVICES | Visible GPUs |
| GGML_CUDA_ENABLE_UNIFIED_MEMORY | Enable unified memory |
| CUDA_SCALE_LAUNCH_QUEUES | CUDA queue scaling |
| HIP_VISIBLE_DEVICES | HIP visible devices |

### Appendix C: Preset Examples

#### Build Presets

**CUDA Performance Build**
```bash
cmake -B build \
  -DGGML_CUDA=ON \
  -DGGML_CUDA_PEER_MAX_BATCH_SIZE=256 \
  -DGGML_CUDA_FA=ON \
  -DGGML_CUDA_GRAPHS=ON \
  -DGGML_CCACHE=ON \
  -DGGML_LTO=ON \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_BUILD_TYPE=Release
```

**Multi-GPU Build**
```bash
cmake -B build \
  -DGGML_CUDA=ON \
  -DGGML_CUDA_PEER_MAX_BATCH_SIZE=512 \
  -DGGML_BLAS=ON \
  -DGGML_BLAS_VENDOR=OpenBLAS \
  -DBUILD_SHARED_LIBS=OFF \
  -DCMAKE_BUILD_TYPE=Release
```

#### Run Presets

**Single GPU, General Purpose**
```bash
./llama-server \
  -m ./model.gguf \
  -c 4096 \
  -ngl 99 \
  -t 8 \
  --temp 0.7 \
  --top-p 0.95 \
  --cont-batching
```

**Multi-GPU, Large Context**
```bash
./llama-server \
  -m ./model.gguf \
  -c 131072 \
  -ngl all \
  -t 16 \
  --split-mode layer \
  --tensor-split 16,12,12 \
  --temp 0.6 \
  --top-p 0.95 \
  --cont-batching
```

### Appendix D: Development Timeline

| Phase | Duration | Start | End |
|-------|----------|-------|-----|
| Phase 1: Setup | 1-2 weeks | Week 1 | Week 2 |
| Phase 2: Build Generator | 2-3 weeks | Week 3 | Week 5 |
| Phase 3: Run Generator | 3-4 weeks | Week 6 | Week 9 |
| Phase 4: Library | 2-3 weeks | Week 10 | Week 12 |
| Phase 5: Testing | 2-3 weeks | Week 13 | Week 15 |
| Phase 6: Polish | 1-2 weeks | Week 16 | Week 17 |

**Total Estimated Duration**: 17-19 weeks

---

## Review Checklist

Before implementation begins, verify:

- [ ] All llama.cpp build flags documented
- [ ] All llama.cpp runtime flags documented
- [ ] All environment variables documented
- [ ] Technical architecture approved
- [ ] Development phases realistic
- [ ] Testing strategy comprehensive
- [ ] Risk mitigation adequate
- [ ] Timeline achievable
- [ ] Resources available

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-03-28 | Initial | Initial draft |

---

**End of Design Document**
