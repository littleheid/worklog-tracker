# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.2.2"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.2/worklog-tracker_0.2.2_darwin_arm64"
      sha256 "37e717a9f77206af94466c9a41bcc63ca62445bdb0cbf0e168effd7a0a154146"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.2/worklog-tracker_0.2.2_darwin_amd64"
      sha256 "35110d714a813b1bf20a9b2b6f1803253ca09451994568b18ecc1d7af6f31fe2"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.2/worklog-tracker_0.2.2_linux_arm64"
      sha256 "095c16d5650b3ac94512318aaae2b967d17534397512ce5eb885486bfce4f25a"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.2/worklog-tracker_0.2.2_linux_amd64"
      sha256 "56c0072acc9fc2f5c2184e0f2a98dc9253b6fdc1e83db11448a78ae55b8c3efe"
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
