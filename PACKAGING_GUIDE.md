# Packaging and Releases

## Automated Releases (Recommended)

MermaidUI uses **GitHub Actions** to automatically build and release the application when you push a version tag.

### Creating a Release

```bash
# Patch release (1.3.0 → 1.3.1)
npm run release

# Minor release (1.3.0 → 1.4.0)
npm run release:minor

# Major release (1.3.0 → 2.0.0)
npm run release:major
```

The release script will:
1. Bump the version in `package.json`, `Cargo.toml`, and `tauri.conf.json`
2. Commit the version changes
3. Create a git tag (e.g., `v1.3.1`)
4. Push to GitHub

GitHub Actions will then automatically:
- Build for Windows (`.exe`, `.msi`)
- Build for macOS (`.dmg`, `.app`)
- Build for Linux (`.deb`, `.AppImage`)
- Create a GitHub Release with all artifacts attached

### Retrying a Failed Release

If the GitHub Actions build fails, fix the issue and re-run:

```bash
npm run release:retag
```

This deletes and recreates the tag, triggering a new build.

---

## Manual Building (Development)

To build the application locally:

```bash
npm run build
```

Built files are in `src-tauri/target/release/bundle/`.

### Platform-Specific Builds

```bash
# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# macOS (Intel)
npm run tauri build -- --target x86_64-apple-darwin

# macOS (Apple Silicon)
npm run tauri build -- --target aarch64-apple-darwin

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

---

## Architecture

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust (Tauri IPC commands)
- **Database**: SQLite via `rusqlite` (stored in app data directory)

No Node.js runtime or external dependencies are required in the packaged app.

### Database Location

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\com.mermaidui.app\mermaid-ui.db` |
| macOS | `~/Library/Application Support/com.mermaidui.app/mermaid-ui.db` |
| Linux | `~/.local/share/com.mermaidui.app/mermaid-ui.db` |

---

## Troubleshooting

### Build Errors

```bash
# Update Rust toolchain
rustup update

# Clear build cache
rm -rf src-tauri/target
npm install
```

### Database Not Found

- Check that the app data directory exists (Tauri creates it automatically)
- Verify file system permissions
- Check console logs for initialization errors
