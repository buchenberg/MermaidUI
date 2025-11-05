# Tauri Packaging Guide for MermaidUI

## Current Status

✅ **The application is ready for packaging!** 

The application has been fully migrated to use Tauri IPC for all backend operations. This means:

- ✅ No Node.js backend required
- ✅ Database uses app data directory (works in packaged apps)
- ✅ Frontend uses Tauri IPC (no HTTP server needed)
- ✅ All dependencies are bundled with Tauri

## Architecture

The application uses a **two-tier architecture**:

- **Frontend**: React + TypeScript + Vite (`src/`)
- **Backend**: Rust (`src-tauri/src/`) - Tauri IPC commands handle all database operations
- **Database**: SQLite via `rusqlite` - stored in app data directory

## Database Location

The database is automatically stored in the appropriate app data directory for each platform:

- **Windows**: `%APPDATA%\com.mermaidui.app\mermaid-ui.db`
- **macOS**: `~/Library/Application Support/com.mermaidui.app/mermaid-ui.db`
- **Linux**: `~/.local/share/com.mermaidui.app/mermaid-ui.db`

This ensures the database persists across updates and works correctly in packaged applications.

## Building for Production

To build the application for distribution:

```bash
npm run build
```

This will:
1. Build the frontend React app (outputs to `dist/`)
2. Build the Tauri application bundle

The built application will be in `src-tauri/target/release/` (or `debug` for debug builds).

### Platform-Specific Builds

To build for a specific platform:

```bash
# Windows
npm run tauri build -- --target x86_64-pc-windows-msvc

# macOS
npm run tauri build -- --target x86_64-apple-darwin
# or for Apple Silicon
npm run tauri build -- --target aarch64-apple-darwin

# Linux
npm run tauri build -- --target x86_64-unknown-linux-gnu
```

## Bundle Size

The application bundle includes:
- Frontend React app (built with Vite)
- Rust binary (Tauri runtime)
- SQLite library (bundled with `rusqlite`)
- Mermaid.js library
- CodeMirror editor

No Node.js runtime or external dependencies are required!

## Packaging Considerations

### Database Migration

When users upgrade from an older version:
- The database will automatically be created in the app data directory
- Existing data from the old backend version won't be automatically migrated
- Users will need to manually export/import if upgrading from the old Node.js backend version

### Permissions

The application requires:
- **File system access**: To read/write the database in the app data directory
- No network permissions needed (no HTTP server)

These permissions are configured in `src-tauri/tauri.conf.json`.

### Testing Before Release

Before packaging, ensure:
1. ✅ Database creates successfully in app data directory
2. ✅ Collections and diagrams CRUD operations work
3. ✅ File upload works correctly
4. ✅ Auto-save functionality works
5. ✅ Application works when launched from the bundle (not just dev mode)

## Distribution

After building, you can distribute:

- **Windows**: `.exe` installer or `.msi` package (configured in `tauri.conf.json`)
- **macOS**: `.dmg` or `.app` bundle
- **Linux**: `.deb`, `.rpm`, or `.AppImage` (depending on configuration)

The installer/packaging format is configured in `src-tauri/tauri.conf.json` under the `bundle` section.

## Troubleshooting

### Database Not Found

If the database isn't being created:
- Check that the app data directory exists (Tauri creates it automatically)
- Verify file system permissions
- Check console logs for database initialization errors

### Build Errors

If you encounter build errors:
- Ensure Rust toolchain is up to date: `rustup update`
- Clear Tauri build cache: `rm -rf src-tauri/target`
- Reinstall dependencies: `npm install`

## Future Enhancements

Potential improvements for future versions:
- Database migration system for schema changes
- Export functionality (if needed, can be implemented client-side or via Rust)
- Plugin system for extending functionality
