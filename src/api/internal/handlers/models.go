package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"llm_api/internal/model"
)

type ModelInfo struct {
	Name string `json:"name"`
	ID   string `json:"id"`
}

// RegisterModelRoutes registers model-related routes.
func RegisterModelRoutes(r *gin.RouterGroup, m *model.Model) {
	r.GET("/models", modelsHandler())
}

// modelsHandler returns a list of available models.
// This is a placeholder implementation.
func modelsHandler() gin.HandlerFunc {
	return func(c *gin.Context) {
		response := []ModelInfo{
			{Name: "llama-2-7b", ID: "12345"},
		}
		c.JSON(http.StatusOK, gin.H{"data": response})
	}
}
