#!/bin/bash
# 一键发布：构建所有平台二进制 → 输出 SHA256 → 准备 GitHub Release 文件
set -e
cd "$(dirname "$0")"

VERSION=${1:?Usage: $0 <version, e.g. 0.1.0>}

echo "=== 1. 构建前端 ==="
npm run build

echo "=== 2. 复制前端产物到 server/dist ==="
rm -rf server/dist
cp -r dist server/dist

echo "=== 3. 跨平台编译 Go ==="
export CGO_ENABLED=0
PLATFORMS=("darwin/amd64" "darwin/arm64" "linux/amd64" "linux/arm64")

mkdir -p release

for p in "${PLATFORMS[@]}"; do
  GOOS="${p%/*}"
  GOARCH="${p#*/}"
  out="worklog-tracker_${VERSION}_${GOOS}_${GOARCH}"
  echo "  -> $GOOS/$GOARCH"
  GOOS=$GOOS GOARCH=$GOARCH \
    go build -C server -ldflags="-s -w" -o "../release/$out" .
done

echo ""
echo "=== 3. SHA256 校验 ==="
cd release
rm -f "worklog-tracker_${VERSION}_checksums.txt"
shasum -a 256 worklog-tracker_* > "worklog-tracker_${VERSION}_checksums.txt"
cat "worklog-tracker_${VERSION}_checksums.txt"

echo ""
echo "=== 完成 ==="
echo "上传 release/ 下所有文件到 GitHub Release v${VERSION}"
echo "然后更新 Formula/worklog-tracker.rb 中的 version 和 sha256"
