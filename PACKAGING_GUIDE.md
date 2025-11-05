# Tauri Packaging Guide for MermaidUI

## Current Issues

The current setup **will NOT work** in a packaged Tauri application because:

1. **Backend server** runs as separate Node.js process - not bundled
2. **Database path** uses `process.cwd()` which is read-only in packaged apps
3. **Frontend hardcodes** `http://localhost:3001/api` - backend won't be running
4. **Node.js runtime** not included in the bundle

## Required Changes

### Option 1: Bundle Backend with Tauri (Recommended)

#### 1. Update Database Path to User Data Directory

**File: `backend/src/database.ts`**
```typescript
import sqlite3 from 'sqlite3';
import path from 'path';
import { appDataDir } from '@tauri-apps/api/path'; // Tauri v1 doesn't have this, need alternative

// For Tauri v1, use environment variable or pass path from Rust
const dbPath = process.env.DATABASE_PATH || path.join(
  process.env.APPDATA || process.env.HOME || process.cwd(),
  'MermaidUI',
  'mermaid-ui.db'
);

// Ensure directory exists
import fs from 'fs';
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
```

#### 2. Make API URL Configurable

**File: `src/App.tsx`**
```typescript
// Detect if running in Tauri
import { invoke } from '@tauri-apps/api/tauri';

const API_BASE = import.meta.env.DEV 
  ? 'http://localhost:3001/api'  // Development
  : 'http://localhost:3001/api'; // Production - backend will be bundled
```

#### 3. Start Backend from Rust

**File: `src-tauri/src/main.rs`**
```rust
use tauri::Manager;
use std::process::{Command, Stdio};
use std::path::PathBuf;

#[tauri::command]
fn get_app_data_dir() -> Result<String, String> {
    let app_data = tauri::api::path::app_data_dir(&tauri::Config::default())
        .ok_or("Failed to get app data dir")?;
    Ok(app_data.to_string_lossy().to_string())
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // Start backend server
            let app_data_dir = tauri::api::path::app_data_dir(&app.config())
                .ok_or("Failed to get app data dir")?;
            
            // Path to bundled backend
            let backend_path = app.path_resolver()
                .resource_dir()
                .expect("Failed to get resource dir")
                .join("backend");
            
            let backend_exe = if cfg!(windows) {
                backend_path.join("node.exe")
            } else {
                backend_path.join("node")
            };
            
            let backend_script = backend_path.join("dist").join("index.js");
            
            // Set DATABASE_PATH environment variable
            std::env::set_var("DATABASE_PATH", 
                app_data_dir.join("mermaid-ui.db").to_string_lossy().to_string());
            
            // Start backend process
            let mut backend_process = Command::new(backend_exe)
                .arg(backend_script)
                .stdout(Stdio::inherit())
                .stderr(Stdio::inherit())
                .spawn()
                .expect("Failed to start backend");
            
            // Store process handle
            app.manage(backend_process);
            
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_app_data_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 4. Bundle Backend in Tauri Resources

**File: `src-tauri/tauri.conf.json`**
```json
{
  "tauri": {
    "bundle": {
      "resources": [
        "../backend/dist/**",
        "../backend/node_modules/**"
      ]
    }
  }
}
```

#### 5. Include Node.js Runtime

You'll need to bundle Node.js runtime with your app or use a tool like:
- `pkg` (https://github.com/vercel/pkg) - Bundle Node.js apps
- `nexe` (https://github.com/nexe/nexe) - Create executables
- Or bundle Node.js binaries with your app

### Option 2: Use Tauri IPC Instead (Better Approach)

Replace the Express backend with Tauri commands:

1. **Move database logic to Rust** using `rusqlite` crate
2. **Create Tauri commands** for each API endpoint
3. **Update frontend** to call Tauri commands instead of HTTP

This avoids bundling Node.js but requires rewriting backend logic.

### Option 3: Use Tauri Plugin System

Tauri v2 has better plugin support, but you're on v1.5. Consider:
- Using Tauri's built-in capabilities
- Creating custom Tauri commands for database operations

## Recommended Approach

For Tauri v1.5 with your current setup:

1. **Short term**: Bundle backend with Node.js runtime
2. **Long term**: Migrate to Tauri IPC commands (no Node.js needed)

## Testing

Before packaging, test:
1. Database creates in user data directory (not app directory)
2. Backend starts automatically when app launches
3. Frontend can connect to backend (check port availability)
4. Exports work with bundled Puppeteer

## Additional Considerations

- **Puppeteer**: Requires Chromium bundled - large file size
- **Port conflicts**: Check if port 3001 is available
- **Permissions**: Ensure app has write access to user data directory
- **Error handling**: Handle backend startup failures gracefully

