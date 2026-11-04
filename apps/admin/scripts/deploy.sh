#!/bin/sh
# Builds the static dashboard and deploys it to Vercel production.
# Run `npx vercel login` once first. The build is copied outside the monorepo so
# Vercel serves the files as-is instead of trying to rebuild the workspace.
set -e
cd "$(dirname "$0")/.."
npx next build
site="$(mktemp -d)/vagago-admin"
mkdir -p "$site"
cp -R out/. "$site/"
cp vercel.json "$site/"
cd "$site"
npx vercel@latest deploy --prod --yes --name vagago-admin
