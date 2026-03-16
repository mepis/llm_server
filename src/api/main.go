package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	})
	http.HandleFunc("/run", runScript)
    http.HandleFunc("/v1/completions", completionsHandler)
	// Load configuration defaults and optional external config file
	cfgPath := "config.json"
	if _, err := os.Stat(cfgPath); err == nil {
		cfgData, err := os.ReadFile(cfgPath)
		if err == nil && len(cfgData) > 0 {
var loaded Config
	if err := json.Unmarshal(cfgData, &loaded); err == nil {
		defaults = &loaded
	}
		}
	}
	log.Println("LLM API server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

func runScript(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req struct {
		Script string `json:"script"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	if req.Script == "" {
		http.Error(w, "`script` field required", http.StatusBadRequest)
		return
	}
	// Ensure script lives in scripts/ directory
	scriptPath := "scripts/" + req.Script
	// Sanitize path
	if strings.Contains(scriptPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	// Check file exists
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		http.Error(w, "Script not found", http.StatusNotFound)
		return
	}
	// Run script
	cmd := exec.Command(scriptPath)
	out, err := cmd.CombinedOutput()
	resp := map[string]string{
		"script": req.Script,
		"output": string(out),
	}
	if err != nil {
		// Include error message in output if needed
		resp["error"] = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// GenerateRequest defines the JSON payload for text generation.
type GenerateRequest struct {
	Prompt                     string  `json:"prompt"`
	Temperature                float64 `json:"temperature,omitempty"`
	TopP                       float64 `json:"top_p,omitempty"`
	TopK                       int     `json:"top_k,omitempty"`
	RepeatPenalty              float64 `json:"repeat_penalty,omitempty"`
	MaxContextTokens           int     `json:"max_context_tokens,omitempty"`
	MaxGeneratingTokens        int     `json:"max_generating_tokens,omitempty"`
	ModelPath                  string  `json:"model,omitempty"`
	Stream                     bool    `json:"stream,omitempty"`
}

// completionsHandler handles POST /v1/completions
// It merges request parameters with server defaults before invoking llama.cpp.
func completionsHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var req GenerateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	// Validate required fields
	if req.Prompt == "" {
		http.Error(w, "`prompt` required", http.StatusBadRequest)
		return
	}
	// Merge request parameters with defaults.
	cfg := defaults
	if req.Temperature != 0 {
		cfg.Temperature = req.Temperature
	}
	if req.TopP != 0 {
		cfg.TopP = req.TopP
	}
	if req.TopK != 0 {
		cfg.TopK = req.TopK
	}
	if req.RepeatPenalty != 0 {
		cfg.RepeatPenalty = req.RepeatPenalty
	}
	if req.MaxContextTokens != 0 {
		cfg.MaxContextTokens = req.MaxContextTokens
	}
	if req.MaxGeneratingTokens != 0 {
		cfg.MaxGeneratingTokens = req.MaxGeneratingTokens
	}
	if req.ModelPath != "" {
		cfg.ModelPath = req.ModelPath
	}
	// Generate text using llama.cpp with merged config.
	generatedText, err := Generate(req.Prompt, cfg)
	if err != nil {
		http.Error(w, "generation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	// Handle streaming response
	if req.Stream {
		// Simple SSE-style streaming: send the full text as a single event
		w.Header().Set("Content-Type", "text/event-stream")
		w.WriteHeader(http.StatusOK)
		fmt.Fprintf(w, "data: %s\n\n", generatedText)
		// Ensure the response is flushed immediately
		if flusher, ok := w.(http.Flusher); ok {
			flusher.Flush()
		}
		return
	}
	// Normal JSON response
	resp := map[string]interface{}{
		"prompt":           req.Prompt,
		"generated_text":   generatedText,
		"used_params":      cfg,
		"message":          "generated",
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}