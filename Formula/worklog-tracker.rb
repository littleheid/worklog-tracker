# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.2.0"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.0/worklog-tracker_0.2.0_darwin_arm64"
      sha256 "ae281841b779c8aa0eb2a836989a6dd728cab0828cacfd3dcaf804f2a3808826"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.0/worklog-tracker_0.2.0_darwin_amd64"
      sha256 "f085dd91ccf4b794021f7aed6dec71d98004aeba1373cf60fdf21f7055d0fed2"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.0/worklog-tracker_0.2.0_linux_arm64"
      sha256 "7f824ad257d732abe0393b4db7587d936c67407478781b647feae54c02882cf2"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.0/worklog-tracker_0.2.0_linux_amd64"
      sha256 "9728e2b7dc24ec078c4514331941af6c615b16a30059c46572e502706a3e6d2e"
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
