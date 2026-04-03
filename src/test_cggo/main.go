package main

/*
#cgo LDFLAGS: -L./llama.cpp/build/bin -lllama -lggml -lggml-base -lggml-cpu
#include "../llama.cpp/include/llama.h"
*/
import "C"
import (
	"fmt"
)

func main() {
	fmt.Println("CGO: Attempting to call llama_model_default_params...")
	params := C.llama_model_default_params()
	fmt.Printf("CGO: Successfully retrieved llama_model_default_params: %+v\n", params)
	fmt.Println("CGO: Success!")
}