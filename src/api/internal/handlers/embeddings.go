package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"llm_api/internal/model"
)

type EmbeddingRequest struct {
	Model string `json:"model"`
	Input string `json:"input"`
}

type EmbeddingResponse struct {
	Data []struct {
		Embedding []float32 `json:"embedding"`
		Index     int       `json:"index"`
	} `json:"data"`
	object  string `json:"object"`
	created int    `json:"created"`
}

// RegisterEmbeddingRoutes registers embedding-related routes.
func RegisterEmbeddingRoutes(r *gin.RouterGroup, m *model.Model) {
	r.POST("/embeddings", embeddingsHandler(m))
}

// embeddingsHandler handles embedding requests.
func embeddingsHandler(m *model.Model) gin.HandlerFunc {
	return func(c *gin.Context) {
		var req EmbeddingRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request payload"})
			return
		}

		// TODO: implement actual embedding inference
		response := EmbeddingResponse{
			Data: []struct {
				Embedding []float32 `json:"embedding"`
				Index     int       `json:"index"`
			}{
				{Embedding: []float32{0.1, 0.2, 0.3}, Index: 0},
			},
			object:  "embedding",
			created: 1700000000,
		}
		c.JSON(http.StatusOK, response)
	}
}
