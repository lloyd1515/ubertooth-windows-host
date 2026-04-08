# Repo hardening status

## Done in-repo
- CI workflow present
- release dry-run workflow present
- PR template present
- issue templates present
- diagnostics taxonomy documented
- release process documented
- changelog started
- code owners file added

## Still recommended on GitHub
- Enable branch protection for `main`
- Require the CI workflow before merge
- Consider preventing force-pushes to `main`
- Consider requiring pull requests for direct edits once collaboration begins
- Ensure the repo-root `LICENSE` file is committed so GitHub detects the project license correctly

## Why this is still manual
These are repository-policy choices that can affect your preferred solo workflow, so they are documented rather than forced automatically.
