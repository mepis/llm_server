package model

import (
	"os/exec"
	"path/filepath"
	"strconv"
)

type Model struct {
	ModelPath  string
	BinaryPath string
}

func NewModel(modelPath string) (*Model, error) {
	absModelPath, err := filepath.Abs(modelPath)
	if err != nil {
		return nil, err
	}

	// Resolve llama-cli binary path
	binaryPath, err := exec.LookPath("llama-cli")
	if err != nil {
		// fallback to compiled path
		binaryPath, err = exec.LookPath(filepath.Join("llama.cpp", "build", "bin", "llama-cli"))
		if err != nil {
			return nil, err
		}
	}
	return &Model{
		ModelPath:  absModelPath,
		BinaryPath: binaryPath,
	}, nil
}

func (m *Model) GenerateCompletion(prompt string, maxTokens int) (string, error) {
	cmd := exec.Command(m.BinaryPath, "-m", m.ModelPath, "-p", prompt, "-n", strconv.Itoa(maxTokens))
	out, err := cmd.CombinedOutput()
	if err != nil {
		return "", err
	}
	return string(out), nil
}

func (m *Model) Close() error {
	return nil
}
