# Documentation: https://docs.brew.sh/Formula-Cookbook
class WorklogTracker < Formula
  desc "Personal local task tracker with SQLite storage"
  homepage "https://github.com/littleheid/worklog-tracker"
  version "0.2.1"

  on_macos do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_darwin_arm64"
      sha256 "090431c2e354b5b393b02107a0b9b1f2c77f1c4a99c8e00d4d5d92b08d2b7a7f"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_darwin_amd64"
      sha256 "7443ac21cc00962d7f37d54659b891f9a42a77807e6f979fa8cf8af2afdec292"
    end
  end

  on_linux do
    if Hardware::CPU.arm?
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_linux_arm64"
      sha256 "a7eb4a22ad671ddef92534b4cb07de841786a0f37bc62c9e6fec7fd477057975"
    else
      url "https://github.com/littleheid/worklog-tracker/releases/download/v0.2.1/worklog-tracker_0.2.1_linux_amd64"
      sha256 "b36f2f9720c589e49d94348afec9fc5ac88b662f293860866e5c339fbea1a467"
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
