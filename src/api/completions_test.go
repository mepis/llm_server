package main

import (
	"testing"
)

// TestDefaultConfig ensures the default configuration contains expected values.
func TestDefaultConfig(t *testing.T) {
	cfg := DefaultConfig()
	if cfg.Temperature != 0.8 {
		t.Errorf("expected Temperature=0.8, got %v", cfg.Temperature)
	}
	if cfg.TopP != 0.9 {
		t.Errorf("expected TopP=0.9, got %v", cfg.TopP)
	}
	if cfg.TopK != 40 {
		t.Errorf("expected TopK=40, got %v", cfg.TopK)
	}
	if cfg.RepeatPenalty != 1.1 {
		t.Errorf("expected RepeatPenalty=1.1, got %v", cfg.RepeatPenalty)
	}
	if cfg.MaxContextTokens != 2048 {
		t.Errorf("expected MaxContextTokens=2048, got %v", cfg.MaxContextTokens)
	}
	if cfg.MaxGeneratingTokens != 256 {
		t.Errorf("expected MaxGeneratingTokens=256, got %v", cfg.MaxGeneratingTokens)
	}
	if cfg.ModelPath == "" {
		t.Errorf("expected ModelPath to be set, got empty")
	}
}

// TestMergeParams checks that request values correctly override defaults.
func TestMergeParams(t *testing.T) {
    defaults = DefaultConfig()
	// Save original defaults for isolation
	origTemperature := defaults.Temperature
	origTopP := defaults.TopP
	origTopK := defaults.TopK
	origRepeatPenalty := defaults.RepeatPenalty
	origMaxContext := defaults.MaxContextTokens
	origMaxGen := defaults.MaxGeneratingTokens
	origModelPath := defaults.ModelPath

	// Create a request with custom values
	req := &GenerateRequest{
		Prompt:       "test",
		Temperature:  0.5,
		TopP:         0.7,
		TopK:         30,
		RepeatPenalty: 1.2,
		MaxContextTokens: 1024,
		MaxGeneratingTokens: 128,
		ModelPath:    "custom.gguf",
		Stream:       false,
	}
	// Merge (replicate logic from completionsHandler)
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
	// Verify overrides
	if cfg.Temperature != 0.5 {
		t.Errorf("Temperature not overridden, got %v", cfg.Temperature)
	}
	if cfg.TopP != 0.7 {
		t.Errorf("TopP not overridden, got %v", cfg.TopP)
	}
	if cfg.TopK != 30 {
		t.Errorf("TopK not overridden, got %v", cfg.TopK)
	}
	if cfg.RepeatPenalty != 1.2 {
		t.Errorf("RepeatPenalty not overridden, got %v", cfg.RepeatPenalty)
	}
	if cfg.MaxContextTokens != 1024 {
		t.Errorf("MaxContextTokens not overridden, got %v", cfg.MaxContextTokens)
	}
	if cfg.MaxGeneratingTokens != 128 {
		t.Errorf("MaxGeneratingTokens not overridden, got %v", cfg.MaxGeneratingTokens)
	}
	if cfg.ModelPath != "custom.gguf" {
		t.Errorf("ModelPath not overridden, got %v", cfg.ModelPath)
	}
	// Restore original defaults
	defaults.Temperature = origTemperature
	defaults.TopP = origTopP
	defaults.TopK = origTopK
	defaults.RepeatPenalty = origRepeatPenalty
	defaults.MaxContextTokens = origMaxContext
	defaults.MaxGeneratingTokens = origMaxGen
	defaults.ModelPath = origModelPath
}

