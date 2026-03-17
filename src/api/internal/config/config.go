package config

import (
	"errors"
	"os"
)

type Config struct {
	ModelPath string
	APIKey    string
}

// Load reads configuration from environment variables.
func Load() (*Config, error) {
	modelPath := os.Getenv("MODEL_PATH")
	if modelPath == "" {
		return nil, errors.New("MODEL_PATH environment variable is required")
	}
	apiKey := os.Getenv("API_KEY")
	return &Config{
		ModelPath: modelPath,
		APIKey:    apiKey,
	}, nil
}
