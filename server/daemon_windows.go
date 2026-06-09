//go:build windows

package main

import (
	"fmt"
	"os"
	"os/exec"
	"strconv"
	"strings"
	"syscall"
)

func startDaemon(port int, dataDir string) {
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
	cmd.SysProcAttr = &syscall.SysProcAttr{
		HideWindow:    true,
		CreationFlags: syscall.CREATE_NEW_PROCESS_GROUP,
	}

	if err := cmd.Start(); err != nil {
		fmt.Printf("Failed to start: %v\n", err)
		return
	}

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

	// Windows: use taskkill
	cmd := exec.Command("taskkill", "/PID", strconv.Itoa(pid), "/F")
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if output, err := cmd.CombinedOutput(); err != nil {
		fmt.Printf("Failed to stop process: %v\n%s\n", err, output)
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

// --- Auto-start (Registry Run key) ---

func installAutoStart(port int, dataDir string) {
	exe, err := os.Executable()
	if err != nil {
		fmt.Printf("Failed to get executable path: %v\n", err)
		return
	}

	// 写入启动文件夹快捷方式（用户级）
	// 使用注册表 HKCU\Software\Microsoft\Windows\CurrentVersion\Run
	regCmd := fmt.Sprintf(
		`reg add "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorklogTracker" /t REG_SZ /d "\"%s\" serve %d" /f`,
		exe, port,
	)
	cmd := exec.Command("cmd", "/C", regCmd)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	if output, err := cmd.CombinedOutput(); err != nil {
		fmt.Printf("Failed to install auto-start: %v\n%s\n", err, output)
		return
	}

	fmt.Printf("Auto-start installed (Registry Run)\n")
	fmt.Printf("Will start on login at http://localhost:%d\n", port)
}

func uninstallAutoStart(dataDir string) {
	cmd := exec.Command("cmd", "/C",
		`reg delete "HKCU\Software\Microsoft\Windows\CurrentVersion\Run" /v "WorklogTracker" /f`,
	)
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true}
	cmd.CombinedOutput()
	fmt.Println("Auto-start removed")
}

// --- 辅助 ---

func readPID(dataDir string) (int, bool) {
	data, err := os.ReadFile(pidFile(dataDir))
	if err != nil {
		return 0, false
	}
	s := strings.TrimSpace(string(data))
	pid, err := strconv.Atoi(s)
	return pid, err == nil
}
