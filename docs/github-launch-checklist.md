# GitHub Launch Checklist

Repo target:
- https://github.com/lloyd1515/ubertooth-windows-host

## Local repo setup
- [x] package metadata points at the GitHub repo
- [x] issue template config added
- [x] PR template added
- [x] CI workflow runs `npm run check`
- [x] release dry-run workflow added

## Before first push
- [ ] initialize local git repo (if not already initialized)
- [ ] set default branch to `main`
- [ ] set remote `origin` to the GitHub repo URL
- [ ] review `README.md`, `SECURITY.md`, `CONTRIBUTING.md`
- [ ] verify `npm run status` on real hardware one more time

## First public milestone should state
- read-only Windows baseline only
- no flashing
- no DFU
- no write path support yet
