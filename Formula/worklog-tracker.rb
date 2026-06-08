# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.1.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_darwin_arm64"
      sha256 "0ab353ff2668089822f37ff0d32a0ccd65e024cf95bb7fc8d9485f370da15db0"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_darwin_amd64"
      sha256 "d33fb3ad075176abff400691a748e94c97862481fc1b6cbe302d5766ab325353"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_linux_arm64"
      sha256 "6ec05a2bc35050c69ff84be65c40ba2ee21481bb966f2b49e0d9e33ea6caeb5e"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.1.0/worklog-tracker_0.1.0_linux_amd64"
      sha256 "23103d08dc39e8e3156231591383cf622f07039a5a618469a62ee6508f694f7b"
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
