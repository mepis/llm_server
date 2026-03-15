package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"strings"
)

func main() {
	http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "OK")
	})
	http.HandleFunc("/run", runScript)
	log.Println("API server listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}

// runScript handles POST /run
// Expects JSON: {"script":"run.sh"}
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
	// Ensure script lives in scripts/ directory
	scriptPath := "scripts/" + req.Script
	// Sanitize path
	if strings.Contains(scriptPath, "..") {
		http.Error(w, "Invalid path", http.StatusBadRequest)
		return
	}
	// Check file exists
	if _, err := os.Stat(scriptPath); os.IsNotExist(err) {
		http.Error(w, "Script not found", http.StatusNotFound)
		return
	}
	// Run script
	cmd := exec.Command(scriptPath)
	out, err := cmd.CombinedOutput()
	resp := map[string]string{
		"script": req.Script,
		"output": string(out),
	}
	if err != nil {
		// Include error message in output if needed
		resp["error"] = err.Error()
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}