#!/bin/bash
set -e
cd "$(dirname "$0")"

# Build Vue frontend
echo "Building frontend..."
npm run build

# Copy to server/
echo "Copying dist to server..."
rm -rf server/dist
cp -r dist server/dist

# Build Go binary
echo "Building Go binary..."
cd server
go build -ldflags="-s -w" -o worklog-tracker .

# Strip debug info for smaller binary
echo "Done: server/worklog-tracker ($(du -h worklog-tracker | cut -f1))"
