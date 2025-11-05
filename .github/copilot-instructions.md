# Copilot Instructions for MermaidUI

## Architecture Overview

MermaidUI is a **Tauri desktop application** with a two-tier architecture:

- **Frontend**: React + TypeScript + Vite (`src/`) - communicates with Rust backend via Tauri IPC
- **Backend**: Rust (`src-tauri/src/`) - provides Tauri commands and database operations
- **Database**: SQLite (`mermaid-ui.db` in app data directory) - stores collections and diagrams
- **Tauri**: Rust wrapper (`src-tauri/`) - handles IPC commands and database access

**Critical**: Use `npm run dev` which starts Tauri (which automatically starts the frontend dev server). Frontend is handled by Tauri's `beforeDevCommand`.

## Key Patterns

### Rust Database Access
- Database operations are in `src-tauri/src/database.rs`
- Uses `rusqlite` with bundled SQLite (no external dependencies)
- Database stored in app data directory (works in packaged apps)
- All CRUD operations implemented with proper mutex locking to prevent deadlocks

### Frontend-Backend Communication
- Frontend uses `invoke()` from `@tauri-apps/api/tauri` to call Rust commands
- API functions abstracted in `src/api.ts`
- No HTTP server needed - direct IPC communication

### Component Structure
- Co-located CSS: each component has matching `.css` file (e.g., `DiagramEditor.tsx` + `DiagramEditor.css`)
- Components import types from `src/App.tsx` (`Collection`, `Diagram` interfaces)
- State management: parent components (`App.tsx`) manage data, pass handlers as props

### Auto-save Pattern
- `DiagramEditor` auto-saves after 2 seconds of inactivity (debounced via `useEffect`)
- Tracks `hasChanges` state, shows "Unsaved changes" indicator
- Manual save button also available

## Development Workflows

### Starting Development
```bash
npm run dev  # Starts Tauri, which automatically starts the frontend dev server
```

**Do NOT** run `dev:frontend` separately - Tauri's `beforeDevCommand` handles it. Running separately causes port conflicts.

### Database Initialization
- Database initialized automatically when Tauri app starts
- Database file created in app data directory (e.g., `%APPDATA%\com.mermaidui.app\mermaid-ui.db` on Windows)
- Default collection created automatically if none exists

### Tauri Configuration
- Edit `src-tauri/tauri.conf.json` for window settings, permissions, bundle config
- Edit `src-tauri/Cargo.toml` for Rust dependencies/features
- **After changing Cargo.toml**: Rust rebuild required - restart dev or rebuild

## File Organization

- **Frontend components**: `src/components/` - one component per file with matching CSS
- **Frontend API**: `src/api.ts` - Tauri IPC wrapper functions
- **Database**: `src-tauri/src/database.rs` - SQLite operations using rusqlite
- **Tauri commands**: `src-tauri/src/main.rs` - Tauri IPC command handlers
- **Tauri config**: `src-tauri/tauri.conf.json`, `src-tauri/Cargo.toml`

## Common Tasks

### Adding a New Tauri Command
1. Add a method to `Database` struct in `src-tauri/src/database.rs` (if database operation needed)
2. Create a `#[tauri::command]` function in `src-tauri/src/main.rs`
3. Register command in `invoke_handler` in `main()`
4. Add frontend function in `src/api.ts` using `invoke()`
5. Update components to use the new API function

### Adding a New Component
1. Create `ComponentName.tsx` and `ComponentName.css` in `src/components/`
2. Import types from `src/App.tsx` if needed
3. Follow prop pattern: parent manages state, passes handlers as props

### Database Mutex Locking
- Always lock the mutex once per operation
- Use internal helper methods (`get_collection_internal`, `get_diagram_internal`) to avoid deadlocks
- Never call public methods that lock from within another locked method

### Tauri Native Features
- File dialogs: `@tauri-apps/api/dialog.save` (requires `dialog-save` feature in Cargo.toml)
- File system: `@tauri-apps/api/fs.writeBinaryFile` (requires `fs-write-file` in Cargo.toml)
- Update `tauri.conf.json` allowlist to enable permissions
- Check `src-tauri/Cargo.toml` features match what you're using

## Error Handling Patterns

- Rust commands: Return `Result<T, String>` - errors converted to strings for IPC
- Frontend: Show alerts for user-facing errors, console.error for debugging
- Database: Errors propagate through `SqliteResult` and converted to strings in commands
- Always handle errors in try/catch blocks when calling API functions

## Type Safety

- Shared types: `Collection` and `Diagram` interfaces defined in `src/api.ts` (frontend) and `src-tauri/src/database.rs` (Rust)
- Rust structs use `Serialize`/`Deserialize` for IPC serialization
- Keep types in sync manually (no shared types package currently)
- Components import types from `src/api.ts` or `src/App.tsx`

