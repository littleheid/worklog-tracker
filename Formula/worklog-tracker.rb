# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.2.1"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_darwin_arm64"
      sha256 "6c5d32ad25ffbbe68c3bcc9c1c44880d7e7aa3d73be6450050dfe88387d09cec"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_darwin_amd64"
      sha256 "ea217645491102b892b822b598d07e8d92a512406cc94ddb966a87c59958ff91"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_linux_arm64"
      sha256 "d0917c7333e8ccea786354f30bd3bf14825737bef36c216d3a597fd4d34b1ee3"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_linux_amd64"
      sha256 "d71da82e6870f0dd4c4dfce38a43e70d737c13e01141e97832e576d89944a287"
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
