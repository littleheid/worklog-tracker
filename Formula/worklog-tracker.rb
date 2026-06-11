# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.2.4"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.4/worklog-tracker_0.2.4_darwin_arm64"
      sha256 "4101739c2fe64fc68e344510cae50b4fed270d8e2c50ff479b8f0679f7523f53"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.4/worklog-tracker_0.2.4_darwin_amd64"
      sha256 "df33fa2bbfade1a162db09230027fd3f6a4198c4998c6236d10645e67d506e9d"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.4/worklog-tracker_0.2.4_linux_arm64"
      sha256 "f731b9947644cd8970c4599a5b596151dcd49d8bea053736b5431c61deeeb957"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.4/worklog-tracker_0.2.4_linux_amd64"
      sha256 "35398e7c6e0398fcb56859cf3bb334cc3f644b7ff91445de8edb0da2ae8b81fc"
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
