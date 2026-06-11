package main

import (
	"database/sql"
	"encoding/json"
	"time"
)

type Task struct {
	ID           string          `json:"id"`
	Title        string          `json:"title"`
	Detail       string          `json:"detail"`
	Month        string          `json:"month"`
	Status       string          `json:"status"`
	Priority     string          `json:"priority"`
	DueDate      *string         `json:"dueDate"`
	CarryFrom    *string         `json:"carryFrom"`
	SourceTaskID *string         `json:"sourceTaskId"`
	Tags         json.RawMessage `json:"tags"`
	Visibility   string          `json:"visibility"`
	Category     string          `json:"category"`
	CreatedAt    int64           `json:"createdAt"`
	UpdatedAt    int64           `json:"updatedAt"`
}

type TaskInput struct {
	Title        string   `json:"title"`
	Detail       string   `json:"detail"`
	Month        string   `json:"month"`
	Status       string   `json:"status"`
	Priority     string   `json:"priority"`
	DueDate      *string  `json:"dueDate"`
	CarryFrom    *string  `json:"carryFrom"`
	SourceTaskID *string  `json:"sourceTaskId"`
	Tags         []string `json:"tags"`
	Visibility   string   `json:"visibility"`
	Category     string   `json:"category"`
}

type TaskQuery struct {
	Month        string
	Status       string
	Priority     string
	Keyword      string
	SortBy       string
	Page         int
	PageSize     int
	Visibility   string
	Category     string
}

type PagedResult struct {
	Items      []Task `json:"items"`
	Total      int    `json:"total"`
	Page       int    `json:"page"`
	PageSize   int    `json:"pageSize"`
	TotalPages int    `json:"totalPages"`
}

type DashboardStats struct {
	Total                int            `json:"total"`
	Done                 int            `json:"done"`
	Doing                int            `json:"doing"`
	Overdue              int            `json:"overdue"`
	StatusDistribution   map[string]int `json:"statusDistribution"`
	PriorityDistribution map[string]int `json:"priorityDistribution"`
	RecentUpdates        []Task         `json:"recentUpdates"`
}

type ImportResult struct {
	Imported int `json:"imported"`
	Skipped  int `json:"skipped"`
}

// CategoryGroup 定义分类组：一个 group 下包含多个 item（叶子分类名）
type CategoryGroup struct {
	Group string   `json:"group"`
	Items []string `json:"items"`
}

func initDB(db *sql.DB) error {
	_, err := db.Exec(`
		CREATE TABLE IF NOT EXISTS tasks (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			detail TEXT DEFAULT '',
			month TEXT NOT NULL,
			status TEXT NOT NULL DEFAULT 'todo',
			priority TEXT NOT NULL DEFAULT 'medium',
			due_date TEXT,
			carry_from TEXT,
			source_task_id TEXT,
			tags TEXT NOT NULL DEFAULT '[]',
			visibility TEXT NOT NULL DEFAULT 'work',
			category TEXT NOT NULL DEFAULT '',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		);
		CREATE INDEX IF NOT EXISTS idx_tasks_month ON tasks(month);
		CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
		CREATE INDEX IF NOT EXISTS idx_tasks_updated ON tasks(updated_at);

		CREATE TABLE IF NOT EXISTS prefs (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		);
	`)
	if err != nil {
		return err
	}

	// 兼容旧数据库：不存在列时添加
	db.Exec(`ALTER TABLE tasks ADD COLUMN tags TEXT NOT NULL DEFAULT '[]'`)
	db.Exec(`ALTER TABLE tasks ADD COLUMN visibility TEXT NOT NULL DEFAULT 'work'`)
	db.Exec(`ALTER TABLE tasks ADD COLUMN category TEXT NOT NULL DEFAULT ''`)
	return nil
}

func scanRow(row *sql.Row) (Task, error) {
	var t Task
	var tagsStr string
	err := row.Scan(&t.ID, &t.Title, &t.Detail, &t.Month, &t.Status, &t.Priority,
		&t.DueDate, &t.CarryFrom, &t.SourceTaskID, &tagsStr, &t.Visibility, &t.Category, &t.CreatedAt, &t.UpdatedAt)
	if tagsStr != "" {
		t.Tags = json.RawMessage(tagsStr)
	}
	return t, err
}

func scanRows(rows *sql.Rows) (Task, error) {
	var t Task
	var tagsStr string
	err := rows.Scan(&t.ID, &t.Title, &t.Detail, &t.Month, &t.Status, &t.Priority,
		&t.DueDate, &t.CarryFrom, &t.SourceTaskID, &tagsStr, &t.Visibility, &t.Category, &t.CreatedAt, &t.UpdatedAt)
	if tagsStr != "" {
		t.Tags = json.RawMessage(tagsStr)
	}
	return t, err
}

func now() int64 { return time.Now().UnixMilli() }

func strptr(s string) *string { return &s }
