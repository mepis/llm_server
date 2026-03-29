#!/bin/bash
# Hardware Detection Script for llama.cpp Configuration
# Gathers system information and provides recommendations

echo "=== System Hardware Information ==="
echo ""

# CPU Information
echo "CPU Information:"
echo "---------------"
if command -v nproc &> /dev/null; then
    echo "Logical Cores: $(nproc)"
fi
if [ -f /proc/cpuinfo ]; then
    echo "Physical Cores: $(grep -c '^processor' /proc/cpuinfo)"
    echo "CPU Model: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
    echo "CPU MHz: $(grep 'cpu MHz' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"
fi
echo ""

# Memory Information
echo "Memory Information:"
echo "-------------------"
if [ -f /proc/meminfo ]; then
    total_mem=$(grep MemTotal /proc/meminfo | awk '{print $2}')
    total_mem_gb=$((total_mem / 1024 / 1024))
    echo "Total RAM: ${total_mem_gb} GB"
fi
echo ""

# GPU Information
echo "GPU Information:"
echo "----------------"
gpu_count=0

# NVIDIA GPUs
if command -v nvidia-smi &> /dev/null; then
    echo "NVIDIA GPUs detected:"
    gpu_count=$(nvidia-smi --list-gpus 2>/dev/null | wc -l)
    echo "Number of GPUs: $gpu_count"
    
    # Get VRAM per GPU
    for i in $(seq 0 $((gpu_count - 1))); do
        vram=$(nvidia-smi --query-gpu=memory.total --format=csv,noheader,nounits | sed -n "$((i+1))p")
        model=$(nvidia-smi --query-gpu=name --format=csv,noheader,nounits | sed -n "$((i+1))p")
        echo "  GPU $i: $model - ${vram} MB VRAM"
    done
fi

# AMD GPUs
if command -v lspci &> /dev/null && dmesg | grep -i "amdgpu" &> /dev/null; then
    echo "AMD GPUs detected (via ROCm):"
    gpu_count_amd=$(lspci | grep -i "vga.*amd" | wc -l)
    if [ $gpu_count_amd -gt 0 ]; then
        echo "Number of AMD GPUs: $gpu_count_amd"
    fi
fi

# Intel GPUs
if command -v lspci &> /dev/null && lspci | grep -i "vga.*intel" &> /dev/null; then
    echo "Intel GPUs detected:"
    gpu_count_intel=$(lspci | grep -i "vga.*intel" | wc -l)
    if [ $gpu_count_intel -gt 0 ]; then
        echo "Number of Intel GPUs: $gpu_count_intel"
    fi
fi

if [ $gpu_count -eq 0 ] && [ $gpu_count_amd -eq 0 ] && [ $gpu_count_intel -eq 0 ]; then
    echo "No dedicated GPUs detected. Using CPU-only mode."
fi
echo ""

# Operating System
echo "Operating System:"
echo "-----------------"
if [ -f /etc/os-release ]; then
    os_name=$(grep "PRETTY_NAME" /etc/os-release | cut -d'"' -f2)
    echo "OS: $os_name"
else
    echo "OS: $(uname -s) $(uname -r)"
fi
echo ""

# Available Tools
echo "Available Tools:"
echo "----------------"
if command -v cmake &> /dev/null; then
    cmake_version=$(cmake --version | head -1)
    echo "✓ CMake: $cmake_version"
else
    echo "✗ CMake: Not installed"
fi

if command -v nvcc &> /dev/null; then
    nvcc_version=$(nvcc --version | head -1)
    echo "✓ CUDA: $nvcc_version"
else
    echo "✗ CUDA: Not installed"
fi

if command -v gcc &> /dev/null; then
    gcc_version=$(gcc --version | head -1)
    echo "✓ GCC: $gcc_version"
else
    echo "✗ GCC: Not installed"
fi

if command -v cc &> /dev/null; then
    cc_version=$(cc --version | head -1)
    echo "✓ Compiler: $cc_version"
else
    echo "✗ Compiler: Not installed"
fi

# Output JSON for parsing by frontend
echo ""
echo "=== END OF OUTPUT ==="
