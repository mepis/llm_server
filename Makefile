# Makefile to automate llama.cpp build and project management

LLAMA_DIR := llama.cpp
BUILD_DIR := $(LLAMA_DIR)/build

.PHONY: all clean build_llama test_cgo

all: build_llama

build_llama:
	@echo "Building llama.cpp..."
	@mkdir -p $(BUILD_DIR)
	@cd $(BUILD_DIR) && cmake .. && make -j$(shell nproc)

test_cggo: build_llama
	@echo "Running CGGO test bridge..."
	@go run src/test_cggo/main.go

clean:
	@echo "Cleaning llama.cpp build directory..."
	@rm -rf $(BUILD_DIR)
	@rm -rf src/test_cgo/main *

.DEFAULT_GOAL := all