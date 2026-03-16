package main

type Config struct {
    ModelPath        string  `json:"model,omitempty"`
    Temperature      float64 `json:"temperature,omitempty"`
    TopP             float64 `json:"top_p,omitempty"`
    TopK             int     `json:"top_k,omitempty"`
    RepeatPenalty    float64 `json:"repeat_penalty,omitempty"`
    MaxContextTokens int     `json:"max_context_tokens,omitempty"`
    MaxGeneratingTokens int  `json:"max_generating_tokens,omitempty"`
    ChatModelPath        string  `json:"chat_model_path,omitempty"`
    ChatTemperature      float64 `json:"chat_temperature,omitempty"`
    ChatTopP             float64 `json:"chat_top_p,omitempty"`
    ChatTopK             int     `json:"chat_top_k,omitempty"`
    ChatRepeatPenalty    float64 `json:"chat_repeat_penalty,omitempty"`
    ChatMaxContextTokens int     `json:"chat_max_context_tokens,omitempty"`
    ChatMaxGeneratingTokens int  `json:"chat_max_generating_tokens,omitempty"`
}

// DefaultConfig returns a Config with sensible default values.
func DefaultConfig() *Config {
	return &Config{
		ModelPath:        "models/gguf/my_model.gguf",
		Temperature:      0.8,
		TopP:             0.9,
		TopK:             40,
		RepeatPenalty:    1.1,
		MaxContextTokens: 2048,
		MaxGeneratingTokens: 256,

}
}
var defaults = DefaultConfig()