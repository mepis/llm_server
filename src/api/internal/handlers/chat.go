package handlers

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"llm_api/internal/model"
	"net/http"
)

type ChatRequest struct {
	Model       string  `json:"model"`
	Prompt      string  `json:"prompt"`
	MaxTokens   int     `json:"max_tokens,omitempty"`
	Stream      bool    `json:"stream,omitempty"`
	Temperature float64 `json:"temperature,omitempty"`
}

type ChatChoice struct {
	Text        string      `json:"text"`
	Index       int         `json:"index"`
	_logprob    interface{} `json:"logprobs,omitempty"`
	_Stop       interface{} `json:"stop,omitempty"`
	_StartToken int         `json:"start_token,omitempty"`
	_EndToken   int         `json:"end_token,omitempty"`
	_RequestId  string      `json:"request_id,omitempty"`
}

type ChatResponse struct {
	ID      string       `json:"id"`
	Object  string       `json:"object"`
	Created int64        `json:"created"`
	Choices []ChatChoice `json:"choices"`
}

func RegisterChatRoutes(r *gin.RouterGroup, m *model.Model) {
	r.POST("/chat/completions", completionsHandler(m))
}

func completionsHandler(m *model.Model) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req ChatRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
			return
		}

		if req.Stream {
			streamCompletions(c, m, req.Prompt, req.MaxTokens)
			return
		}

		output, err := m.GenerateCompletion(req.Prompt, req.MaxTokens)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "generation failed"})
			return
		}

		response := ChatResponse{
			ID:      "chat-123",
			Object:  "chat.completion",
			Created: 1700000000,
			Choices: []ChatChoice{
				{
					Text:  output,
					Index: 0,
				},
			},
		}
		c.JSON(http.StatusOK, response)
	}
}

func streamCompletions(c *gin.Context, m *model.Model, prompt string, maxTokens int) {
	c.Header("Content-Type", "text/event-stream")
	c.Header("Cache-Control", "no-cache")
	c.Header("Connection", "keep-alive")

	output, err := m.GenerateCompletion(prompt, maxTokens)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "generation failed"})
		return
	}

	fmt.Fprint(c.Writer, "data: "+output+"\n\n")
	if flusher, ok := c.Writer.(http.Flusher); ok {
		flusher.Flush()
	}
}
