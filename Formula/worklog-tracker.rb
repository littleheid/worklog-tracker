# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_darwin_arm64"
      sha256 "15404e014aef6c2097b49122d74b9b8b65571d91c4fecbfad1a5fe1453f75670"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_darwin_amd64"
      sha256 "af64a49c4b91423f5eb103a2264551c4903059efe2f47b3d3e6b4048b6c1ca53"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_linux_arm64"
      sha256 "ca8c459c8d8548458e8abd60305ea6ff82b91cdba24a431b04d09e613a5e2e70"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_linux_amd64"
      sha256 "2a5186e1b969f68ab7265e03467a38c501d2b23382041aad62a9aa9aab4f47a3"
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
