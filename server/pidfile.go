package main

import (
	"path/filepath"
)

func pidFile(dataDir string) string {
	return filepath.Join(dataDir, "worklog.pid")
}
