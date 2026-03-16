package main

/*
#cgo CFLAGS: -I../llama.cpp/include -I../llama.cpp/ggml/include
#cgo LDFLAGS: -L/home/jon/git/llm_server/llama.cpp/build/src -l:libllama.a
#include "llama.h"
#include <stdlib.h>
#include <string.h>

char* generate_text(const char* model_path, const char* prompt,
                    double temperature, double top_p, int top_k,
                    double repeat_penalty, int max_context_tokens,
                    int max_generating_tokens) {
    // Simple placeholder: return a static string.
    static char *out = (char*)"dummy";
    return out;
}
*/
import "C"
import (
    "fmt"
    "unsafe"
)

// Generate uses the compiled llama.cpp inference code to produce text.
func Generate(prompt string, cfg *Config) (string, error) {
    if cfg == nil {
        return "", fmt.Errorf("config cannot be nil")
    }
    cPrompt := C.CString(prompt)
    defer C.free(unsafe.Pointer(cPrompt))

    // Use defaults from cfg
    temp := C.double(cfg.Temperature)
    topP := C.double(cfg.TopP)
    topK := C.int(cfg.TopK)
    repeatPenalty := C.double(cfg.RepeatPenalty)
    maxContext := C.int(cfg.MaxContextTokens)
    maxGen := C.int(cfg.MaxGeneratingTokens)
    modelPath := C.CString(cfg.ModelPath)
    defer C.free(unsafe.Pointer(modelPath))

    var cOutput *C.char
    // Call the C function, passing individual params.
    cOutput = C.generate_text(modelPath, cPrompt,
        temp, topP, topK,
        repeatPenalty, maxContext,
        maxGen)
    if cOutput == nil {
        return "", fmt.Errorf("generation failed")
    }
    // The C function returns a static string that must not be freed.
     // Therefore we skip the free to avoid double free or invalid free.
     return C.GoString(cOutput), nil
}