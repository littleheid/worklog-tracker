//go:build !windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strconv"
	"syscall"
)

func startDaemon(port int, dataDir string) {
	// 检查是否已在运行
	if pid, running := readPID(dataDir); running {
		fmt.Printf("Already running (PID: %d)\n", pid)
		return
	}

	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("Failed to get executable path: %v\n", err)
		return
	}
	cmd := exec.Command(exe, "serve", strconv.Itoa(port))
	cmd.Stdout = nil
	cmd.Stderr = nil
	cmd.SysProcAttr = &syscall.SysProcAttr{Setsid: true}

	if err := cmd.Start(); err != nil {
		fmt.Printf("Failed to start: %v\n", err)
		return
	}

	// 写入 PID 文件
	if err := os.WriteFile(pidFile(dataDir), []byte(strconv.Itoa(cmd.Process.Pid)), 0644); err != nil {
		fmt.Printf("Failed to write PID file: %v\n", err)
	}
	fmt.Printf("Started (PID: %d) on http://localhost:%d\n", cmd.Process.Pid, port)
	fmt.Printf("Data: %s\n", dataDir)
}

func stopDaemon(dataDir string) {
	pid, running := readPID(dataDir)
	if !running {
		fmt.Println("Not running")
		return
	}

	proc, err := os.FindProcess(pid)
	if err != nil {
		fmt.Printf("Process not found: %v\n", err)
		os.Remove(pidFile(dataDir))
		return
	}
	if err := proc.Signal(syscall.SIGTERM); err != nil {
		fmt.Printf("Failed to stop process: %v\n", err)
	}
	fmt.Printf("Stopped (PID: %d)\n", pid)
	os.Remove(pidFile(dataDir))
}

func checkStatus(dataDir string) {
	pid, running := readPID(dataDir)
	if running {
		fmt.Printf("Running (PID: %d)\n", pid)
	} else {
		fmt.Println("Not running")
	}
}

func readPID(dataDir string) (int, bool) {
	data, err := os.ReadFile(pidFile(dataDir))
	if err != nil {
		return 0, false
	}
	pid, err := strconv.Atoi(string(data))
	return pid, err == nil
}

// --- Auto-start (launchd macOS) ---

func installAutoStart(port int, dataDir string) {
	if runtime.GOOS != "darwin" {
		fmt.Println("Auto-start only supported on macOS (launchd)")
		return
	}

	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("Failed to get executable path: %v\n", err)
		return
	}
	home, err := os.UserHomeDir()
	if err != nil {
		fmt.Printf("Failed to get home directory: %v\n", err)
		return
	}
	plistDir := filepath.Join(home, "Library", "LaunchAgents")
	os.MkdirAll(plistDir, 0755) // 目录已存在时不报错
	plistPath := filepath.Join(plistDir, "com.worklog.tracker.plist")

	plist := fmt.Sprintf(`<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>Label</key>
	<string>com.worklog.tracker</string>
	<key>ProgramArguments</key>
	<array>
		<string>%s</string>
		<string>serve</string>
		<string>%d</string>
	</array>
	<key>RunAtLoad</key>
	<true/>
	<key>KeepAlive</key>
	<false/>
	<key>StandardOutPath</key>
	<string>%s</string>
	<key>StandardErrorPath</key>
	<string>%s</string>
</dict>
</plist>`, exe, port,
		filepath.Join(dataDir, "stdout.log"),
		filepath.Join(dataDir, "stderr.log"))

	if err := os.WriteFile(plistPath, []byte(plist), 0644); err != nil {
		fmt.Printf("Failed to write plist: %v\n", err)
		return
	}
	if err := exec.Command("launchctl", "load", plistPath).Run(); err != nil {
		fmt.Printf("Failed to load launchd service: %v\n", err)
		return
	}
	fmt.Printf("Auto-start installed (launchd)\n")
	fmt.Printf("Plist: %s\n", plistPath)
	fmt.Printf("Will start on login at http://localhost:%d\n", port)
}

func uninstallAutoStart(dataDir string) {
	if runtime.GOOS != "darwin" {
		return
	}
	home, _ := os.UserHomeDir()
	plistPath := filepath.Join(home, "Library", "LaunchAgents", "com.worklog.tracker.plist")
	// 卸载失败可能是服务未加载，忽略错误继续删除 plist
	exec.Command("launchctl", "unload", plistPath).Run()
	os.Remove(plistPath)
	fmt.Println("Auto-start removed")
}
