# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_darwin_arm64"
      sha256 "dc81ad383ba3541a6c5e5cf4c77670b9c0b57fd1ff04c1efc24b27425162e5ca"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_darwin_amd64"
      sha256 "2f65cc88bd4b38c6214309ef4745b0f96b5b96ac4a18879fd34efe12b8acf398"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_linux_arm64"
      sha256 "e8643a350de7b891691b826f8835e455f21f42e6a35017449497e0ca3ad2288a"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_linux_amd64"
      sha256 "463bc1b8154babbbbdc3b9d6c35c49a742a7004669c8cf964ec4d57142d798ae"
    end
  end

  def install
    bin.install Dir["*"].first => "worklog-tracker"
  end

  def post_install
    ohai "Worklog Tracker installed!"
    ohai "  Start:   worklog-tracker start"
    ohai "  Status:  worklog-tracker status"
    ohai "  Stop:    worklog-tracker stop"
    ohai "  Auto-start on login: worklog-tracker install"
    ohai "  Data:    ~/.worklog-tracker/"
  end

  test do
    system "#{bin}/worklog-tracker", "version"
  end
end
