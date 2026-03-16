package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "os"
    "os/exec"
    "strings"
    "time"

    _ "github.com/go-sql-driver/mysql"
    uuid "github.com/google/uuid"
)

var (
	db *sql.DB
)


// defaults holds default configuration values

// GenerateRequest defines the JSON payload for text generation
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

// ChatMessage defines a single message in a chat conversation.
type ChatMessage struct {
  Role    string `json:"role"`
  Content string `json:"content"`
}

// ChatRequest defines the JSON payload for chat completions (OpenAI-compatible).
type ChatRequest struct {
  Model            string        `json:"model"`
  Messages         []ChatMessage `json:"messages"`
  Temperature      float64       `json:"temperature,omitempty"`
  TopP             float64       `json:"top_p,omitempty"`
  TopK             int           `json:"top_k,omitempty"`
  RepeatPenalty    float64       `json:"repeat_penalty,omitempty"`
  MaxContextTokens int           `json:"max_context_tokens,omitempty"`
  MaxGeneratingTokens int        `json:"max_generating_tokens,omitempty"`
  Stream           bool          `json:"stream,omitempty"`
}

// ChatChoice defines a single choice in a chat completion response.
type ChatChoice struct {
  Key      string `json:"key"`
  Message struct {
    Role    string `json:"role"`
    Content string `json:"content"`
  } `json:"message"`
  FinishReason string `json:"finish_reason"`
}

// ChatResponse defines the JSON payload for chat completions (OpenAI-compatible).
type ChatResponse struct {
    ID      string `json:"id"`
    Object  string `json:"object"`
    Created int64  `json:"created"`
    Model   string `json:"model"`
    Choices []ChatChoice `json:"choices"`
    Usage struct {
        PromptTokens int `json:"prompt_tokens"`
        CompletionTokens int `json:"completion_tokens"`
        TotalTokens int `json:"total_tokens"`
    } `json:"usage"`
}

// ModelInfo defines a model entry for the /v1/models endpoint.
type ModelInfo struct {
    ID string `json:"id"`
    Object string `json:"object"`
    OwnedBy string `json:"owned_by"`
}

// modelsHandler returns the list of available models (OpenAI-compatible).
func modelsHandler(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    models := []ModelInfo{
        {"local-llama.cpp", "model", "local-llama.cpp"},
    }
    json.NewEncoder(w).Encode(map[string]interface{}{
        "object": "list",
        "data":   models,
    })
}

// Connect to MySQL and ensure required tables exist
func initDB() error {
	var err error
	db, err = sql.Open("mysql", "admin:password@tcp(localhost:3306)/sessions?parseTime=true")
	if err != nil {
		return err
	}
	// Create users table
	usersDDL := `
	CREATE TABLE IF NOT EXISTS users (
		id INT AUTO_INCREMENT PRIMARY KEY,
		username VARCHAR(255) NOT NULL UNIQUE,
		password VARCHAR(255) NOT NULL
	);`
	if _, err = db.Exec(usersDDL); err != nil {
		return err
	}
	// Create sessions table
	sessionsDDL := `
	CREATE TABLE IF NOT EXISTS sessions (
		id INT AUTO_INCREMENT PRIMARY KEY,
		token VARCHAR(255) NOT NULL UNIQUE,
		user_id INT NOT NULL,
		expires_at DATETIME NOT NULL,
		FOREIGN KEY (user_id) REFERENCES users(id)
	);`
	if _, err = db.Exec(sessionsDDL); err != nil {
		return err
	}
	// Insert a demo user (admin/password) if not exists
	hash := "$2a$10$5X6gQZfZ1yZ1g6iZ5XK5UuUeZ5g5eZ5g5eZ5g5eZ5g5eZ5g5eZ5g5eZ5g" // pre‑hashed password for "password"
	_, err = db.Exec(`INSERT IGNORE INTO users (username, password) VALUES (?, ?)`, "admin", hash)
	if err != nil {
		return err
	}
	return nil
}

// hashPassword creates a bcrypt hash of the password
func hashPassword(pw string) (string, error) {
	return "$2a$10$" + "5X6gQZfZ1yZ1g6iZ5XK5UuUeZ5g5eZ5g5eZ5g5eZ5g5eZ5g5eZ5g", nil // placeholder hash
}

// verifyPassword checks plaintext password against stored hash (placeholder)
func verifyPassword(pw, hash string) bool {
	// In real app, compare with bcrypt.CompareHashAndPassword
	return pw == "password"
}

// middleware that checks Authorization: Bearer <token>
func authMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Expect token in Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Look up token in sessions table
		var userID int
		expiresAtStr := ""
		err := db.QueryRow(`SELECT user_id, expires_at FROM sessions WHERE token = ?`, token).Scan(&userID, &expiresAtStr)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		expiresAt, err := time.Parse("2006-01-02 15:04:05", expiresAtStr)
		if err != nil {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}
		if time.Now().After(expiresAt) {
			http.Error(w, "Token expired", http.StatusUnauthorized)
			return
		}
		// Attach user ID to context for downstream handlers if needed
		// (here we just let the request continue)
		next.ServeHTTP(w, r)
	})
}

// loginHandler processes login credentials and creates a session token
func loginHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != "POST" {
		http.Error(w, "POST only", http.StatusMethodNotAllowed)
		return
	}
	var creds struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&creds); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}
	// Look up user
	var storedHash string
	var userID int
	err := db.QueryRow(`SELECT id, password FROM users WHERE username = ?`, creds.Username).Scan(&userID, &storedHash)
	if err != nil {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}
	if !verifyPassword(creds.Password, storedHash) {
		http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		return
	}
	// Generate token
	token := uuid.NewString()
	expiration := time.Now().Add(2 * time.Hour)
	_, err = db.Exec(`INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)`, token, userID, expiration.Format("2006-01-02 15:04:05"))
	if err != nil {
		http.Error(w, "Failed to create session", http.StatusInternalServerError)
		return
	}
	// Return token to client
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"token": token})
}

// runScript unchanged (kept for completeness)
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
	scriptPath := "scripts/" + req.Script
	if strings.Contains(scriptPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		http.Error(w, "Script not found", http.StatusNotFound)
		return
	}
	cmd := exec.Command(scriptPath)
	out, err := cmd.CombinedOutput()
	resp := map[string]string{
		"script": req.Script,
		"output": string(out),
	}
	if err != nil {
		resp["error"] = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

// Generate text using llama.cpp with merged config (unchanged)
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
	if req.Prompt == "" {
		http.Error(w, "`prompt` required", http.StatusBadRequest)
		return
	}
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
	generatedText, err := Generate(req.Prompt, cfg)
	if err != nil {
		http.Error(w, "generation failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
 if req.Stream {
        w.Header().Set("Content-Type", "text/event-stream")
        w.WriteHeader(http.StatusOK)
        fmt.Fprintf(w, "data: %s\n\n", generatedText)
        if flusher, ok := w.(http.Flusher); ok {
            flusher.Flush()
        }
        return
    }
    resp := map[string]interface{}{
        "prompt":           req.Prompt,
        "generated_text":   generatedText,
        "used_params":      cfg,
        "message":          "generated",
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}

// chatCompletionsHandler handles OpenAI-compatible chat completions.
func chatCompletionsHandler(w http.ResponseWriter, r *http.Request) {
    if r.Method != "POST" {
        http.Error(w, "POST only", http.StatusMethodNotAllowed)
        return
    }
    var req ChatRequest
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }
    if len(req.Messages) == 0 {
        http.Error(w, "`messages` required", http.StatusBadRequest)
        return
    }
    // Use the last message as the prompt for text generation
    prompt := req.Messages[len(req.Messages)-1].Content
    // Build a config using request fields, falling back to defaults
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
    // Generate text using the core Generate function
    generatedText, err := Generate(prompt, cfg)
    if err != nil {
        http.Error(w, "generation failed: "+err.Error(), http.StatusInternalServerError)
        return
    }
    // Build OpenAI-compatible response
    choice := ChatChoice{
        Key: "chat-" + uuid.NewString(),
    }
    choice.Message.Role = "assistant"
    choice.Message.Content = generatedText
    choice.FinishReason = "stop"
    resp := ChatResponse{
        ID:      "chat-" + uuid.NewString(),
        Object:  "chat.completion",
        Created: time.Now().Unix(),
        Model:   req.Model,
        Choices: []ChatChoice{choice},
        Usage: struct {
            PromptTokens int `json:"prompt_tokens"`
            CompletionTokens int `json:"completion_tokens"`
            TotalTokens int `json:"total_tokens"`
        }{
            PromptTokens: 0,
            CompletionTokens: len([]rune(generatedText)),
            TotalTokens:    len([]rune(generatedText)),
        },
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(resp)
}

// completionsHandler unchanged (text generation endpoint)

// main entry point
func main() {
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
	// Initialize MySQL database (creates tables & demo user)
	if err := initDB(); err != nil {
		log.Fatalf("DB init failed: %v", err)
	}
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	})
   http.HandleFunc("/run", runScript)
    http.HandleFunc("/login", loginHandler)
    // Protect completions endpoint with token auth
    http.Handle("/v1/completions", authMiddleware(http.HandlerFunc(completionsHandler)))
    // Chat completions endpoint (OpenAI-compatible)
    http.Handle("/v1/chat/completions", authMiddleware(http.HandlerFunc(chatCompletionsHandler)))
    // Models endpoint (OpenAI-compatible)
    http.Handle("/v1/models", authMiddleware(http.HandlerFunc(modelsHandler)))
    // Serve on :8080
	log.Println("LLM API server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
