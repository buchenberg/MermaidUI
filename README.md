# MermaidUI

A desktop application built with Tauri for viewing and editing Mermaid diagrams. The application features collections management, a split-pane editor with live preview, and auto-save functionality.

## Features

- **Collections Management**: Organize diagrams into collections
- **Text Editor**: Edit Mermaid diagram code with syntax highlighting using CodeMirror
- **Live Preview**: Real-time preview of diagrams as you type
- **File Upload**: Upload existing `.mmd` or `.mermaid` files
- **Auto-save**: Optional automatic saving of content changes (with manual save option)
- **Resizable Split Pane**: Adjustable editor/preview layout with hide/show functionality

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust (Tauri IPC)
- **Database**: SQLite (via `rusqlite`)
- **Desktop Framework**: Tauri
- **Diagram Rendering**: Mermaid.js
- **Editor**: CodeMirror 6

## Prerequisites

- Node.js (v18 or higher)
- Rust (latest stable version) - Install via [rustup](https://rustup.rs/)
- npm or yarn

### Windows-specific Requirements

On Windows, you need Microsoft Visual C++ Build Tools for Rust to compile native dependencies:

1. **Option 1 (Recommended)**: Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)
   - Download "Build Tools for Visual Studio 2022"
   - During installation, select "Desktop development with C++" workload

2. **Option 2**: Install [Visual Studio Community](https://visualstudio.microsoft.com/downloads/)
   - During installation, select "Desktop development with C++" workload

After installation, restart your terminal and try again.

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MermaidUI
```

2. Install dependencies:
```bash
npm install
```

3. Install Rust (if not already installed):
   - Install via [rustup](https://rustup.rs/)
   - Tauri will handle Rust dependencies automatically

## Development

To run the application in development mode:

```bash
npm run dev
```

This will:
- Start the frontend Vite dev server on `http://localhost:5173`
- Launch the Tauri application (which connects to the dev server)

The application uses Tauri IPC for frontend-backend communication - no separate backend server is needed.

## Building

To build the application for production:

```bash
npm run build
```

This will:
- Build the frontend React app
- Create the Tauri application bundle

The built application will be in `src-tauri/target/release/` (or `debug` for debug builds).

## Project Structure

```
MermaidUI/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── api.ts              # Tauri IPC API wrapper
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── src-tauri/              # Tauri Rust code
│   ├── src/
│   │   ├── main.rs         # Tauri entry point and commands
│   │   └── database.rs     # SQLite database operations
│   ├── Cargo.toml          # Rust dependencies
│   └── tauri.conf.json     # Tauri configuration
├── package.json            # Frontend dependencies
└── vite.config.ts          # Vite configuration
```

## Architecture

The application uses **Tauri IPC** for communication between the frontend and backend:

- **Frontend** (`src/`): React + TypeScript application that uses `invoke()` to call Rust commands
- **Backend** (`src-tauri/src/`): Rust code that handles database operations via Tauri commands
- **Database**: SQLite database stored in the app data directory (works in packaged applications)

### Tauri Commands

The following Tauri commands are available:

**Collections:**
- `get_collections` - Get all collections
- `get_collection` - Get a specific collection
- `create_collection` - Create a new collection
- `update_collection` - Update a collection
- `delete_collection` - Delete a collection

**Diagrams:**
- `get_diagrams_by_collection` - Get all diagrams in a collection
- `get_diagram` - Get a specific diagram
- `create_diagram` - Create a new diagram
- `update_diagram` - Update a diagram
- `delete_diagram` - Delete a diagram

Frontend code uses the `src/api.ts` module which provides a clean abstraction over these Tauri commands.

## Database

The application uses SQLite for persistence. The database file (`mermaid-ui.db`) is automatically created in the app data directory when you first run the application:

- **Windows**: `%APPDATA%\com.mermaidui.app\mermaid-ui.db`
- **macOS**: `~/Library/Application Support/com.mermaidui.app/mermaid-ui.db`
- **Linux**: `~/.local/share/com.mermaidui.app/mermaid-ui.db`

A default collection is automatically created if none exists when the application starts.

## License

MIT

