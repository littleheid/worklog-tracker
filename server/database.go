package main

import (
	"crypto/rand"
	"database/sql"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

func openDB(dataDir string) (*sql.DB, error) {
	db, err := sql.Open("sqlite", dataDir+"/worklog.db")
	if err != nil {
		return nil, err
	}
	db.SetMaxOpenConns(1)
	if err := initDB(db); err != nil {
		return nil, err
	}
	return db, nil
}

func genID() string {
	b := make([]byte, 8)
	rand.Read(b)
	return hex.EncodeToString(b)
}

func todayStr() string {
	now := time.Now()
	return fmt.Sprintf("%d-%02d-%02d", now.Year(), now.Month(), now.Day())
}

func toJSON(v []string) string {
	if len(v) == 0 {
		return "[]"
	}
	b, _ := json.Marshal(v)
	return string(b)
}

// --- Task CRUD ---

func createTask(db *sql.DB, input TaskInput) (Task, error) {
	title := strings.TrimSpace(input.Title)
	if title == "" {
		return Task{}, fmt.Errorf("title is required")
	}
	if len(title) > 200 {
		return Task{}, fmt.Errorf("title too long (max 200)")
	}
	detail := strings.TrimSpace(input.Detail)
	if len(detail) > 5000 {
		return Task{}, fmt.Errorf("detail too long (max 5000)")
	}
	ts := now()
	t := Task{
		ID:           genID(),
		Title:        title,
		Detail:       detail,
		Month:        input.Month,
		Status:       input.Status,
		Priority:     input.Priority,
		DueDate:      input.DueDate,
		CarryFrom:    input.CarryFrom,
		SourceTaskID: input.SourceTaskID,
		CreatedAt:    ts,
		UpdatedAt:    ts,
	}
	if t.Status == "" {
		t.Status = "todo"
	}
	if t.Priority == "" {
		t.Priority = "medium"
	}

	tagsJSON := "[]"
	if len(input.Tags) > 0 {
		tagsJSON = toJSON(input.Tags)
	}
	t.Tags = json.RawMessage(tagsJSON)

	_, err := db.Exec(`INSERT INTO tasks (id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at)
		VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
		t.ID, t.Title, t.Detail, t.Month, t.Status, t.Priority, t.DueDate, t.CarryFrom, t.SourceTaskID, tagsJSON, t.CreatedAt, t.UpdatedAt)
	return t, err
}

func updateTask(db *sql.DB, id string, input TaskInput) (Task, error) {
	row := db.QueryRow(`SELECT id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at FROM tasks WHERE id=?`, id)
	t, err := scanRow(row)
	if err != nil {
		return Task{}, fmt.Errorf("task not found")
	}

	if input.Title != "" {
		t.Title = strings.TrimSpace(input.Title)
	}
	if input.Detail != "" {
		t.Detail = strings.TrimSpace(input.Detail)
	}
	if input.Status != "" {
		t.Status = input.Status
	}
	if input.Priority != "" {
		t.Priority = input.Priority
	}
	if input.DueDate != nil {
		t.DueDate = input.DueDate
	}
	if input.Month != "" {
		t.Month = input.Month
	}
	t.UpdatedAt = now()

	if len(input.Tags) > 0 {
		tagsJSON := toJSON(input.Tags)
		t.Tags = json.RawMessage(tagsJSON)
		_, err = db.Exec(`UPDATE tasks SET title=?,detail=?,month=?,status=?,priority=?,due_date=?,carry_from=?,source_task_id=?,tags=?,updated_at=? WHERE id=?`,
			t.Title, t.Detail, t.Month, t.Status, t.Priority, t.DueDate, t.CarryFrom, t.SourceTaskID, tagsJSON, t.UpdatedAt, id)
	} else {
		_, err = db.Exec(`UPDATE tasks SET title=?,detail=?,month=?,status=?,priority=?,due_date=?,carry_from=?,source_task_id=?,updated_at=? WHERE id=?`,
			t.Title, t.Detail, t.Month, t.Status, t.Priority, t.DueDate, t.CarryFrom, t.SourceTaskID, t.UpdatedAt, id)
	}
	return t, err
}

func deleteTask(db *sql.DB, id string) error {
	_, err := db.Exec(`DELETE FROM tasks WHERE id=?`, id)
	return err
}

func getTask(db *sql.DB, id string) (Task, error) {
	row := db.QueryRow(`SELECT id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at FROM tasks WHERE id=?`, id)
	return scanRow(row)
}

func listTasks(db *sql.DB, q TaskQuery) ([]Task, int, error) {
	where := []string{"1=1"}
	args := []interface{}{}

	if q.Month != "" {
		where = append(where, "month=?")
		args = append(args, q.Month)
	}
	if q.Status != "" && q.Status != "all" {
		where = append(where, "status=?")
		args = append(args, q.Status)
	}
	if q.Priority != "" && q.Priority != "all" {
		where = append(where, "priority=?")
		args = append(args, q.Priority)
	}
	if q.Keyword != "" {
		where = append(where, "(title LIKE ? OR detail LIKE ?)")
		kw := "%" + q.Keyword + "%"
		args = append(args, kw, kw)
	}

	whereClause := strings.Join(where, " AND ")

	var total int
	countQ := fmt.Sprintf("SELECT COUNT(*) FROM tasks WHERE %s", whereClause)
	if err := db.QueryRow(countQ, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("counting tasks: %w", err)
	}

	orderBy := "updated_at DESC"
	switch q.SortBy {
	case "updated_asc":
		orderBy = "updated_at ASC"
	case "created_desc":
		orderBy = "created_at DESC"
	case "due_asc":
		orderBy = "CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, due_date ASC"
	case "priority_desc":
		orderBy = "CASE priority WHEN 'high' THEN 3 WHEN 'medium' THEN 2 ELSE 1 END DESC"
	}

	if q.Page <= 0 {
		q.Page = 1
	}
	if q.PageSize <= 0 {
		q.PageSize = 10
	}
	offset := (q.Page - 1) * q.PageSize

	query := fmt.Sprintf("SELECT id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at FROM tasks WHERE %s ORDER BY %s LIMIT ? OFFSET ?", whereClause, orderBy)
	args = append(args, q.PageSize, offset)

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, 0, err
	}
	defer rows.Close()

	var tasks []Task
	for rows.Next() {
		t, err := scanRows(rows)
		if err != nil {
			return nil, 0, err
		}
		tasks = append(tasks, t)
	}
	if tasks == nil {
		tasks = []Task{}
	}
	return tasks, total, nil
}

func getAllTasks(db *sql.DB) ([]Task, error) {
	rows, err := db.Query(`SELECT id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at FROM tasks ORDER BY updated_at DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var tasks []Task
	for rows.Next() {
		t, err := scanRows(rows)
		if err != nil {
			return nil, err
		}
		tasks = append(tasks, t)
	}
	if tasks == nil {
		tasks = []Task{}
	}
	return tasks, nil
}

// --- Dashboard ---

func dashboardStats(db *sql.DB, month string, maxRecent int) (DashboardStats, error) {
	if maxRecent <= 0 || maxRecent > 50 {
		maxRecent = 8
	}
	s := DashboardStats{
		StatusDistribution:   map[string]int{"todo": 0, "doing": 0, "done": 0, "paused": 0},
		PriorityDistribution: map[string]int{"high": 0, "medium": 0, "low": 0},
		RecentUpdates:        []Task{},
	}

	rows, err := db.Query(`SELECT id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at FROM tasks WHERE month=? ORDER BY updated_at ASC`, month)
	if err != nil {
		return s, err
	}
	defer rows.Close()

	var all []Task
	today := todayStr()
	for rows.Next() {
		t, err := scanRows(rows)
		if err != nil {
			return s, err
		}
		all = append(all, t)
		s.Total++
		s.StatusDistribution[t.Status]++
		s.PriorityDistribution[t.Priority]++

		if t.Status == "done" {
			s.Done++
		}
		if t.Status == "doing" {
			s.Doing++
		}
		if t.DueDate != nil && t.Status != "done" && *t.DueDate < today {
			s.Overdue++
		}
	}

	// 升序结果的最后 maxRecent 条作为最近更新
	for i := len(all) - 1; i >= 0 && len(s.RecentUpdates) < maxRecent; i-- {
		s.RecentUpdates = append(s.RecentUpdates, all[i])
	}
	return s, nil
}

func listMonths(db *sql.DB) ([]string, error) {
	rows, err := db.Query(`SELECT DISTINCT month FROM tasks ORDER BY month DESC`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	var months []string
	for rows.Next() {
		var m string
		if err := rows.Scan(&m); err != nil {
			return months, err
		}
		months = append(months, m)
	}
	return months, nil
}

// --- Carry over ---

func carryOver(db *sql.DB, fromMonth, toMonth string) (int, error) {
	if fromMonth == toMonth {
		return 0, nil
	}

	rows, err := db.Query(`SELECT id FROM tasks WHERE month=? AND status!='done'`, fromMonth)
	if err != nil {
		return 0, err
	}
	defer rows.Close()

	var sourceIDs []string
	for rows.Next() {
		var id string
		if err := rows.Scan(&id); err != nil {
			continue
		}
		sourceIDs = append(sourceIDs, id)
	}

	count := 0
	for _, sid := range sourceIDs {
		var exists int
		if err := db.QueryRow(`SELECT COUNT(*) FROM tasks WHERE month=? AND source_task_id=?`, toMonth, sid).Scan(&exists); err != nil {
			continue
		}
		if exists > 0 {
			continue
		}

		row := db.QueryRow(`SELECT id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at FROM tasks WHERE id=?`, sid)
		t, err := scanRow(row)
		if err != nil {
			continue
		}

		ts := now()
		_, err = db.Exec(`INSERT INTO tasks (id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at)
			VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
			genID(), t.Title, t.Detail, toMonth, t.Status, t.Priority, t.DueDate, fromMonth, sid, t.Tags, ts, ts)
		if err == nil {
			count++
		}
	}
	return count, nil
}

// --- Import/Export ---

func bulkImport(db *sql.DB, items []TaskInput, mode string) (ImportResult, error) {
	var r ImportResult

	tx, err := db.Begin()
	if err != nil {
		return r, err
	}
	defer tx.Rollback() // no-op after Commit

	if mode == "replace" {
		if _, err := tx.Exec("DELETE FROM tasks"); err != nil {
			return r, fmt.Errorf("clearing tasks for import: %w", err)
		}
	}

	for _, input := range items {
		if strings.TrimSpace(input.Title) == "" {
			r.Skipped++
			continue
		}
		// Use tx for consistency
		ts := now()
		t := Task{
			ID:           genID(),
			Title:        strings.TrimSpace(input.Title),
			Detail:       strings.TrimSpace(input.Detail),
			Month:        input.Month,
			Status:       input.Status,
			Priority:     input.Priority,
			DueDate:      input.DueDate,
			CarryFrom:    input.CarryFrom,
			SourceTaskID: input.SourceTaskID,
			CreatedAt:    ts,
			UpdatedAt:    ts,
		}
		if t.Status == "" {
			t.Status = "todo"
		}
		if t.Priority == "" {
			t.Priority = "medium"
		}
		tagsJSON := "[]"
		if len(input.Tags) > 0 {
			tagsJSON = toJSON(input.Tags)
		}
		_, err := tx.Exec(`INSERT INTO tasks (id,title,detail,month,status,priority,due_date,carry_from,source_task_id,tags,created_at,updated_at)
			VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
			t.ID, t.Title, t.Detail, t.Month, t.Status, t.Priority, t.DueDate, t.CarryFrom, t.SourceTaskID, tagsJSON, t.CreatedAt, t.UpdatedAt)
		if err != nil {
			r.Skipped++
			continue
		}
		r.Imported++
	}

	if err := tx.Commit(); err != nil {
		return r, err
	}
	return r, nil
}

// --- Prefs ---

func getPref(db *sql.DB, key string) (string, error) {
	var value string
	err := db.QueryRow(`SELECT value FROM prefs WHERE key=?`, key).Scan(&value)
	return value, err
}

func setPref(db *sql.DB, key, value string) error {
	_, err := db.Exec(`INSERT OR REPLACE INTO prefs (key,value) VALUES (?,?)`, key, value)
	return err
}

// --- Seed ---

func seedDemo(db *sql.DB) (int, error) {
	var count int
	if err := db.QueryRow(`SELECT COUNT(*) FROM tasks`).Scan(&count); err != nil {
		return 0, fmt.Errorf("checking existing tasks: %w", err)
	}
	if count > 0 {
		return 0, nil
	}

	demo := []TaskInput{
		{Title: "Q2 绩效复盘", Detail: "收集团队指标，准备全员会议幻灯片。跟进各部门负责人获取输入。", Month: "2026-06", Status: "doing", Priority: "high", DueDate: strptr("2026-06-15"), Tags: []string{"管理", "报告"}},
		{Title: "更新新人入职文档", Detail: "补充新工具使用指南和常见问题解答。", Month: "2026-06", Status: "todo", Priority: "low", DueDate: strptr("2026-06-20"), Tags: []string{"文档", "新人"}},
		{Title: "修复 API 限流 Bug", Detail: "高并发场景下限流器未正确释放连接。", Month: "2026-06", Status: "done", Priority: "high", DueDate: strptr("2026-06-05"), Tags: []string{"后端", "Bug"}},
		{Title: "部署 v2.1 版本", Detail: "包含性能优化和安全补丁的例行发布。", Month: "2026-06", Status: "done", Priority: "medium", Tags: []string{"运维", "发布"}},
		{Title: "安排一对一沟通", Detail: "与团队成员进行月度一对一反馈。", Month: "2026-06", Status: "todo", Priority: "medium", DueDate: strptr("2026-06-10"), Tags: []string{"管理"}},
		{Title: "数据库迁移方案评估", Detail: "评估从 MySQL 8.0 迁移到 8.4 的兼容性和风险。", Month: "2026-06", Status: "paused", Priority: "low", Tags: []string{"后端", "数据库"}},
		{Title: "优化构建流水线速度", Detail: "当前 CI 耗时 12 分钟，目标优化到 5 分钟内。", Month: "2026-06", Status: "doing", Priority: "medium", DueDate: strptr("2026-06-18"), Tags: []string{"工具", "CI/CD"}},
		{Title: "编写技术分享材料", Detail: "下周五团队分享会主题：Go 并发模式最佳实践。", Month: "2026-06", Status: "todo", Priority: "medium", DueDate: strptr("2026-06-12"), Tags: []string{"文档", "分享"}},
	}

	inserted := 0
	for _, input := range demo {
		_, err := createTask(db, input)
		if err == nil {
			inserted++
		}
	}
	return inserted, nil
}
