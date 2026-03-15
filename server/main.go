package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	// Determine port from environment variable or default to 3000
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	// Path to the built VuePress documentation
	staticDir := filepath.Join("..", "docs", ".vuepress", "dist")

	// Custom handler that serves files and falls back to index.html
	indexHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Resolve the requested file path
		filePath := filepath.Join(staticDir, r.URL.Path)

		// Check if the file exists
		if _, err := os.Stat(filePath); err == nil {
			// File exists, serve it
			http.ServeFile(w, r, filePath)
			return
		}

		// If file doesn't exist, serve index.html (fallback for SPA)
		indexPath := filepath.Join(staticDir, "index.html")
		if _, err := os.Stat(indexPath); err == nil {
			http.ServeFile(w, r, indexPath)
		} else {
			// If index.html is also missing, return 404
			http.Error(w, "file not found", http.StatusNotFound)
		}
	})

	// Serve all requests through the custom handler
	http.Handle("/", indexHandler)

	log.Printf("Docs server running at http://localhost:%s", port)
}