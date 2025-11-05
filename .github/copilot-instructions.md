# Copilot Instructions for MermaidUI

## Architecture Overview

MermaidUI is a **Tauri desktop application** with a three-tier architecture:

- **Frontend**: React + TypeScript + Vite (`src/`) - communicates with backend via REST API
- **Backend**: Node.js + Express + TypeScript (`backend/src/`) - provides REST API and handles exports
- **Database**: SQLite (`backend/mermaid-ui.db`) - stores collections and diagrams
- **Tauri**: Rust wrapper (`src-tauri/`) - minimal Rust code, mostly configuration

**Critical**: The backend must start **before** Tauri launches. Use `npm run dev` which uses `npm-run-all`'s `run-p` to run backend and delayed Tauri in parallel (Tauri waits 3 seconds). Frontend is handled by Tauri's `beforeDevCommand`.

## Key Patterns

### Backend Database Access
- Use promise wrappers from `backend/src/database.ts`: `runQuery<T>()`, `runAll<T>()`, `run()`
- Never call `sqlite3` directly - the wrappers handle callback-to-promise conversion
- Database initializes on startup and creates default collection if none exists

### Frontend-Backend Communication
- API base URL hardcoded as `http://localhost:3001/api` in components
- Frontend includes **retry logic** for backend connection (see `src/App.tsx` `fetchCollections()`)
- Backend runs on port 3001, frontend dev server on 5173

### Export System
- **All exports use Puppeteer** - Mermaid needs DOM environment, can't render in Node.js directly
- Export routes (`backend/src/routes/export.ts`) launch headless browser, inject Mermaid CDN, wait for render
- **Always close browser** in finally blocks to prevent resource leaks
- Tauri native file dialogs used for save (`@tauri-apps/api/dialog.save`, `@tauri-apps/api/fs.writeBinaryFile`)

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
npm run dev  # Uses npm-run-all to run backend and delayed Tauri in parallel
```

The `dev` script uses `run-p` to run backend and `dev:tauri-delayed` in parallel. The delayed Tauri script waits 3 seconds before starting to give backend time to initialize.

**Do NOT** run `dev:frontend` separately - Tauri's `beforeDevCommand` handles it. Running separately causes port conflicts.

### Backend Startup
- Backend must initialize database before accepting requests
- Database file created at `process.cwd()/mermaid-ui.db` (configurable via `DATABASE_PATH` env var)
- Server logs initialization status - check console for connection issues

### Tauri Configuration
- Edit `src-tauri/tauri.conf.json` for window settings, permissions, bundle config
- Edit `src-tauri/Cargo.toml` for Rust dependencies/features
- **After changing Cargo.toml**: Rust rebuild required - restart dev or rebuild

## File Organization

- **Frontend components**: `src/components/` - one component per file with matching CSS
- **Backend routes**: `backend/src/routes/` - Express routers (collections, diagrams, export)
- **Database**: `backend/src/database.ts` - SQLite setup and query helpers
- **Tauri**: `src-tauri/` - minimal Rust (`src/main.rs`), config (`tauri.conf.json`, `Cargo.toml`)

## Common Tasks

### Adding a New API Endpoint
1. Create route in `backend/src/routes/` or add to existing router
2. Use `runQuery`, `runAll`, or `run` from `database.ts` for DB access
3. Register route in `backend/src/index.ts` with `app.use()`
4. Frontend: call via `fetch()` to `http://localhost:3001/api/...`

### Adding a New Component
1. Create `ComponentName.tsx` and `ComponentName.css` in `src/components/`
2. Import types from `src/App.tsx` if needed
3. Follow prop pattern: parent manages state, passes handlers as props

### Modifying Export Formats
- Export routes in `backend/src/routes/export.ts` follow same pattern:
  1. Fetch diagram from DB
  2. Launch Puppeteer browser
  3. Inject HTML with Mermaid CDN
  4. Wait for `.mermaid svg` selector
  5. Extract/screenshot/generate PDF
  6. Close browser in finally block

### Tauri Native Features
- File dialogs: `@tauri-apps/api/dialog.save` (requires `dialog-save` feature in Cargo.toml)
- File system: `@tauri-apps/api/fs.writeBinaryFile` (requires `fs-write-file` in Cargo.toml)
- Update `tauri.conf.json` allowlist to enable permissions
- Check `src-tauri/Cargo.toml` features match what you're using

## Error Handling Patterns

- Backend: Return `{ error: string, details?: string }` JSON on errors
- Frontend: Show alerts for user-facing errors, console.error for debugging
- Export: Always cleanup Puppeteer browser instances (try/finally pattern)
- Database: Errors propagate through promise wrappers, catch at route level

## Type Safety

- Shared types: `Collection` and `Diagram` interfaces defined in both `src/App.tsx` and `backend/src/database.ts`
- Keep types in sync manually (no shared types package currently)
- Components import types from `src/App.tsx`, backend imports from `database.ts`

