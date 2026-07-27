#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"
output_path="${1:-${repo_root}/.ci-cd/artifacts/X-Drive-Arena-debug.apk}"

cd "${repo_root}"

npm run build
npx cap sync android

cd "${repo_root}/android"
./gradlew --no-daemon testDebugUnitTest assembleDebug

mkdir -p "$(dirname "${output_path}")"
cp "${repo_root}/android/app/build/outputs/apk/debug/app-debug.apk" "${output_path}"

sha256sum "${output_path}"
