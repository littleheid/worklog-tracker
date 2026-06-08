// worklog-tracker 是一个本地工作项追踪工具。
// 提供 REST API 后端、SQLite 存储、守护进程管理和 launchd 开机自启。
package main

import (
	"fmt"
	"os"
)

const (
	defaultPort    = 4173
	defaultDataDir = "~/.worklog-tracker"
)

func main() {
	if len(os.Args) < 2 {
		printUsage()
		return
	}

	cmd := os.Args[1]
	port := defaultPort
	dd := dataDir()

	switch cmd {
	case "serve":
		if len(os.Args) > 2 {
			fmt.Sscanf(os.Args[2], "%d", &port)
		}
		runServer(port, dd)

	case "start":
		startDaemon(port, dd)

	case "stop":
		stopDaemon(dd)

	case "restart":
		stopDaemon(dd)
		startDaemon(port, dd)

	case "status":
		checkStatus(dd)

	case "install":
		installAutoStart(port, dd)

	case "version":
		fmt.Println("worklog-tracker v0.2.0")

	case "uninstall":
		uninstallAutoStart(dd)

	default:
		fmt.Printf("Unknown command: %s\n\n", cmd)
		printUsage()
	}
}

func printUsage() {
	fmt.Print(`Worklog Tracker — local personal task tracker

Usage:
  worklog-tracker serve [port]   Run in foreground (default port 4173)
  worklog-tracker start          Start as background daemon
  worklog-tracker stop           Stop the daemon
  worklog-tracker restart        Restart the daemon
  worklog-tracker status         Check daemon status
  worklog-tracker install        Install as launchd service (auto-start on boot)
  worklog-tracker uninstall      Remove launchd service

Data stored in: ~/.worklog-tracker/
`)
}

func dataDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to get home directory: %v\n", err)
		os.Exit(1)
	}
	dd := home + "/.worklog-tracker"
	if err := os.MkdirAll(dd, 0755); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to create data directory: %v\n", err)
		os.Exit(1)
	}
	return dd
}
