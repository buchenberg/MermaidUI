# Release Guide

This guide explains how to create a new release of MermaidUI.

## Versioning Strategy

We use [Semantic Versioning](https://semver.org/) (semver):
- **MAJOR** version (X.0.0): Breaking changes
- **MINOR** version (0.X.0): New features, backwards compatible
- **PATCH** version (0.0.X): Bug fixes, backwards compatible

## Release Process

### 1. Update Version Numbers

Use the version script to bump versions across all files:

```bash
# Bump patch version (1.0.0 -> 1.0.1)
npm run version patch

# Bump minor version (1.0.0 -> 1.1.0)
npm run version minor

# Bump major version (1.0.0 -> 2.0.0)
npm run version major

# Or set a specific version
npm run version 1.2.3
```

This automatically updates:
- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`

### 2. Update CHANGELOG.md

Edit `CHANGELOG.md` to document the changes in this release:

```markdown
## [1.0.1] - 2025-01-XX

### Fixed
- Fixed issue with diagram name updates

### Changed
- Improved error messages
```

### 3. Commit and Tag

```bash
# Stage version changes
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md

# Commit the version bump
git commit -m "chore: bump version to 1.0.1"

# Create an annotated tag
git tag -a v1.0.1 -m "Release v1.0.1"

# Push commits and tags
git push origin main
git push origin v1.0.1
```

### 4. Create GitHub Release

1. Go to https://github.com/buchenberg/MermaidUI/releases/new
2. Click "Choose a tag" and select your new tag (e.g., `v1.0.1`)
3. Set the release title to `v1.0.1` or `Release v1.0.1`
4. Copy the relevant section from `CHANGELOG.md` into the release description
5. Optionally attach build artifacts from `src-tauri/target/release/bundle/`
6. Click "Publish release"

### 5. Build and Distribute (Optional)

If you want to include binaries in the release:

```bash
# Build the application
npm run build

# The installers will be in:
# - Windows: src-tauri/target/release/bundle/msi/
# - macOS: src-tauri/target/release/bundle/dmg/
# - Linux: src-tauri/target/release/bundle/appimage/
```

Then upload these files to the GitHub release.

## Quick Reference

```bash
# Complete release workflow
npm run version patch                    # Bump version
# Edit CHANGELOG.md
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json CHANGELOG.md
git commit -m "chore: bump version to X.Y.Z"
git tag -a vX.Y.Z -m "Release vX.Y.Z"
git push origin main --tags
npm run build                            # Build binaries (optional)
# Create GitHub release via web UI
```

## Best Practices

- **Always update CHANGELOG.md** before creating a release
- **Use annotated tags** (`-a` flag) for better release notes
- **Test the build** before tagging a release
- **Keep release notes** concise and user-focused
- **Tag releases immediately** after committing version changes

