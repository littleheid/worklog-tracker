package main

import (
	"database/sql"
	"embed"
	"encoding/json"
	"fmt"
	"io/fs"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
)

//go:embed dist
var distFS embed.FS

func runServer(port int, dataDir string) {
	db, err := openDB(dataDir)
	if err != nil {
		fmt.Printf("Failed to open database: %v\n", err)
		return
	}
	defer db.Close()

	mux := http.NewServeMux()

	// API
	mux.HandleFunc("GET /api/tasks", func(w http.ResponseWriter, r *http.Request) { apiListTasks(w, r, db) })
	mux.HandleFunc("POST /api/tasks", func(w http.ResponseWriter, r *http.Request) { apiCreateTask(w, r, db) })
	mux.HandleFunc("PUT /api/tasks/{id}", func(w http.ResponseWriter, r *http.Request) { apiUpdateTask(w, r, db) })
	mux.HandleFunc("DELETE /api/tasks/{id}", func(w http.ResponseWriter, r *http.Request) { apiDeleteTask(w, r, db) })
	mux.HandleFunc("GET /api/tasks/{id}", func(w http.ResponseWriter, r *http.Request) { apiGetTask(w, r, db) })
	mux.HandleFunc("GET /api/dashboard", func(w http.ResponseWriter, r *http.Request) { apiDashboard(w, r, db) })
	mux.HandleFunc("GET /api/months", func(w http.ResponseWriter, r *http.Request) { apiMonths(w, r, db) })
	mux.HandleFunc("POST /api/tasks/carry-over", func(w http.ResponseWriter, r *http.Request) { apiCarryOver(w, r, db) })
	mux.HandleFunc("POST /api/tasks/import", func(w http.ResponseWriter, r *http.Request) { apiImport(w, r, db) })
	mux.HandleFunc("GET /api/tasks/export", func(w http.ResponseWriter, r *http.Request) { apiExport(w, r, db) })
	mux.HandleFunc("POST /api/tasks/seed", func(w http.ResponseWriter, r *http.Request) { apiSeed(w, r, db) })
	mux.HandleFunc("GET /api/prefs/{key}", func(w http.ResponseWriter, r *http.Request) { apiGetPref(w, r, db) })
	mux.HandleFunc("PUT /api/prefs/{key}", func(w http.ResponseWriter, r *http.Request) { apiSetPref(w, r, db) })

	// Auth
	mux.HandleFunc("GET /api/auth/status", func(w http.ResponseWriter, r *http.Request) { apiAuthStatus(w, r, db) })
	mux.HandleFunc("POST /api/auth/verify-password", func(w http.ResponseWriter, r *http.Request) { apiVerifyPassword(w, r, db) })
	mux.HandleFunc("PUT /api/auth/set-password", func(w http.ResponseWriter, r *http.Request) { apiSetPassword(w, r, db) })

	// Categories
	mux.HandleFunc("GET /api/categories", func(w http.ResponseWriter, r *http.Request) { apiGetCategories(w, r, db) })
	mux.HandleFunc("PUT /api/categories", func(w http.ResponseWriter, r *http.Request) { apiSetCategories(w, r, db) })

	// 静态文件服务
	distDir, err := fs.Sub(distFS, "dist")
	if err != nil {
		fmt.Printf("Failed to load embedded frontend: %v\n", err)
		return
	}
	mux.Handle("GET /", http.FileServer(http.FS(distDir)))

	addr := fmt.Sprintf(":%d", port)
	fmt.Printf("Worklog Tracker → http://localhost%s\n", addr)
	openBrowser(fmt.Sprintf("http://localhost%s", addr))

	if err := http.ListenAndServe(addr, mux); err != nil {
		fmt.Printf("Server error: %v\n", err)
	}
}

func openBrowser(url string) {
	switch runtime.GOOS {
	case "darwin":
		exec.Command("open", url).Start()
	case "linux":
		exec.Command("xdg-open", url).Start()
	}
}

func writeJSON(w http.ResponseWriter, v interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(v)
}

func errJSON(w http.ResponseWriter, code int, msg string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(code)
	json.NewEncoder(w).Encode(map[string]string{"error": msg})
}

// --- Handlers ---

func apiListTasks(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	q := r.URL.Query()
	query := TaskQuery{
		Month:      q.Get("month"),
		Status:     q.Get("status"),
		Priority:   q.Get("priority"),
		Keyword:    q.Get("keyword"),
		SortBy:     q.Get("sortBy"),
		Visibility: q.Get("visibility"),
		Category:   q.Get("category"),
	}
	if p := q.Get("page"); p != "" {
		query.Page, _ = strconv.Atoi(p)
	}
	if ps := q.Get("pageSize"); ps != "" {
		query.PageSize, _ = strconv.Atoi(ps)
	}
	if query.Page <= 0 {
		query.Page = 1
	}
	if query.PageSize <= 0 {
		query.PageSize = 10
	}

	items, total, err := listTasks(db, query)
	if err != nil {
		errJSON(w, 500, err.Error())
		return
	}
	totalPages := total / query.PageSize
	if total%query.PageSize > 0 {
		totalPages++
	}

	writeJSON(w, PagedResult{
		Items: items, Total: total, Page: query.Page,
		PageSize: query.PageSize, TotalPages: totalPages,
	})
}

func apiCreateTask(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var input TaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	task, err := createTask(db, input)
	if err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, task)
}

func apiUpdateTask(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	id := r.PathValue("id")
	var input TaskInput
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	task, err := updateTask(db, id, input)
	if err != nil {
		errJSON(w, 404, err.Error())
		return
	}
	writeJSON(w, task)
}

func apiDeleteTask(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	id := r.PathValue("id")
	if err := deleteTask(db, id); err != nil {
		errJSON(w, 404, err.Error())
		return
	}
	writeJSON(w, map[string]string{"ok": "deleted"})
}

func apiGetTask(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	id := r.PathValue("id")
	task, err := getTask(db, id)
	if err != nil {
		errJSON(w, 404, "Task not found")
		return
	}
	writeJSON(w, task)
}

func apiDashboard(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	month := r.URL.Query().Get("month")
	maxRecent := 8
	if l := r.URL.Query().Get("limit"); l != "" {
		if n, err := strconv.Atoi(l); err == nil && n > 0 && n <= 50 {
			maxRecent = n
		}
	}
	visibility := r.URL.Query().Get("visibility")
	stats, err := dashboardStats(db, month, maxRecent, visibility)
	if err != nil {
		errJSON(w, 500, err.Error())
		return
	}
	writeJSON(w, stats)
}

func apiMonths(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	months, err := listMonths(db)
	if err != nil {
		writeJSON(w, []string{})
		return
	}
	if months == nil {
		months = []string{}
	}
	writeJSON(w, months)
}

func apiCarryOver(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var body struct {
		FromMonth string `json:"fromMonth"`
		ToMonth   string `json:"toMonth"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	count, err := carryOver(db, body.FromMonth, body.ToMonth)
	if err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, map[string]int{"count": count})
}

func apiImport(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var body struct {
		Items []TaskInput `json:"items"`
		Mode  string      `json:"mode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	result, err := bulkImport(db, body.Items, body.Mode)
	if err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, result)
}

func apiExport(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	visibility := r.URL.Query().Get("visibility")
	tasks, err := getAllTasks(db, visibility)
	if err != nil {
		errJSON(w, 500, err.Error())
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tasks)
}

func apiSeed(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	count, err := seedDemo(db)
	if err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, map[string]int{"count": count})
}

func apiGetPref(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	key := r.PathValue("key")
	value, err := getPref(db, key)
	if err != nil {
		errJSON(w, 404, "")
		return
	}
	writeJSON(w, map[string]string{"key": key, "value": value})
}

func apiSetPref(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	key := r.PathValue("key")
	var body struct {
		Value string `json:"value"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	if err := setPref(db, key, body.Value); err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, map[string]string{"ok": "saved"})
}

// --- Auth Handlers ---

func apiAuthStatus(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	writeJSON(w, map[string]bool{"isSet": isPasswordSet(db)})
}

func apiVerifyPassword(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var body struct {
		Password string `json:"password"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	writeJSON(w, map[string]bool{"ok": verifyPassword(db, body.Password)})
}

func apiSetPassword(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var body struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	if err := setPassword(db, body.OldPassword, body.NewPassword); err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, map[string]string{"ok": "saved"})
}

// --- Categories Handlers ---

func apiGetCategories(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	cats, err := getCategories(db)
	if err != nil {
		errJSON(w, 500, err.Error())
		return
	}
	writeJSON(w, cats)
}

func apiSetCategories(w http.ResponseWriter, r *http.Request, db *sql.DB) {
	var groups []CategoryGroup
	if err := json.NewDecoder(r.Body).Decode(&groups); err != nil {
		errJSON(w, 400, "Invalid JSON")
		return
	}
	if err := setCategories(db, groups); err != nil {
		errJSON(w, 400, err.Error())
		return
	}
	writeJSON(w, map[string]string{"ok": "saved"})
}
