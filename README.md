# MermaidUI

A desktop application for creating and editing Mermaid diagrams. Features collections management, a split-pane editor with live preview, and auto-save functionality.

## Download

Download the latest release for your platform from [GitHub Releases](https://github.com/buchenberg/MermaidUI/releases).

## Features

- **Collections Management**: Organize diagrams into collections
- **Syntax Highlighting**: CodeMirror editor with Mermaid support
- **Live Preview**: Real-time diagram rendering as you type
- **File Upload**: Import existing `.mmd` or `.mermaid` files
- **Auto-save**: Optional automatic saving
- **Resizable Split Pane**: Adjustable editor/preview layout

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Rust (Tauri IPC)
- **Database**: SQLite
- **Desktop**: Tauri
- **Rendering**: Mermaid.js
- **Editor**: CodeMirror 6

## Development

### Prerequisites

- Node.js (v18+)
- Rust (via [rustup](https://rustup.rs/))
- Windows: [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) with "Desktop development with C++"

### Setup

```bash
git clone https://github.com/buchenberg/MermaidUI.git
cd MermaidUI
npm install
npm run dev
```

### Building

```bash
npm run build
```

## Releases

Releases are automated via GitHub Actions. To create a new release:

```bash
npm run release          # Patch (1.0.0 → 1.0.1)
npm run release:minor    # Minor (1.0.0 → 1.1.0)
npm run release:major    # Major (1.0.0 → 2.0.0)
```

See [PACKAGING_GUIDE.md](PACKAGING_GUIDE.md) for more details.

## Project Structure

```
MermaidUI/
├── src/                    # React frontend
│   ├── components/         # UI components
│   ├── api.ts              # Tauri IPC wrapper
│   └── App.tsx             # Main component
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── main.rs         # Tauri commands
│   │   └── database.rs     # SQLite operations
│   └── tauri.conf.json     # Tauri config
└── .github/workflows/      # CI/CD
    └── release.yml         # Automated releases
```

## Database

SQLite database is stored in the platform's app data directory:

| Platform | Path |
|----------|------|
| Windows | `%APPDATA%\com.mermaidui.app\mermaid-ui.db` |
| macOS | `~/Library/Application Support/com.mermaidui.app/mermaid-ui.db` |
| Linux | `~/.local/share/com.mermaidui.app/mermaid-ui.db` |

## License

MIT
