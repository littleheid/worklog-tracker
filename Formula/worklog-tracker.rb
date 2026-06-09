# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.2.3"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.3/worklog-tracker_0.2.3_darwin_arm64"
      sha256 "14becc1d48de60c59a33c242d53161885254e57d669a9af1b83a58521fe19a77"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.3/worklog-tracker_0.2.3_darwin_amd64"
      sha256 "5ba6f14add8aa26be071a9bdcb785a5b0d6f8baa848831bf0458d689fcfd3b3b"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.3/worklog-tracker_0.2.3_linux_arm64"
      sha256 "30680b53783e9bbfdb086fb85fe725850919c4b2c713de9bf8662cfd3f4daabe"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.3/worklog-tracker_0.2.3_linux_amd64"
      sha256 "441eba72822c3e34fa92a7527ff4017bf120e20b8bea957048063fb8ded9a232"
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
