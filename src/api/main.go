package main

import (
	log "log"
	"os"

	"github.com/gin-gonic/gin"
	zlog "github.com/rs/zerolog/log"

	"llm_api/internal/config"
	"llm_api/internal/handlers"
	"llm_api/internal/middleware"
	"llm_api/internal/model"
)

func main() {
	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	// Initialize llama model wrapper
	m, err := model.NewModel(cfg.ModelPath)
	if err != nil {
		log.Fatalf("failed to load model: %v", err)
	}
	defer m.Close()

	// Create Gin router
	r := gin.Default()

	// Global middleware
	r.Use(middleware.JWTAuth(cfg.APIKey))
	r.Use(gin.Recovery())

	// API routes
	api := r.Group("/api")
	{
		handlers.RegisterChatRoutes(api, m)
		handlers.RegisterEmbeddingRoutes(api, m)
		handlers.RegisterModelRoutes(api, m)
	}

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	// Serve Vue3 application
	// Static files are served from ../app/dist relative to the binary's working directory
	r.Static("/app", "../app/dist")
	// Fallback for SPA routing - serve index.html for any unmatched routes under /app/*
	r.Any("/app/*path", func(c *gin.Context) {
		c.File("../app/dist/index.html")
	})

	// Run server
	addr := os.Getenv("PORT")
	if addr == "" {
		addr = "0.0.0.0:8080"
	}
	zlog.Info().Str("addr", addr).Msg("starting server")
	if err := r.Run(addr); err != nil {
		log.Fatalf("failed to start server: %v", err)
	}
}
