# MermaidUI

A desktop application built with Tauri for viewing, editing, and exporting Mermaid diagrams. The application features collections management, a split-pane editor with live preview, and export capabilities in multiple formats.

## Features

- 📁 **Collections Management**: Organize diagrams into collections
- 📝 **Text Editor**: Edit Mermaid diagram code with syntax highlighting
- 👁️ **Live Preview**: Real-time preview of diagrams as you type
- 📤 **Export**: Export diagrams as SVG, PNG, or PDF
- 📥 **File Upload**: Upload existing `.mmd` or `.mermaid` files
- 💾 **Auto-save**: Automatic saving of changes (with manual save option)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Database**: SQLite
- **Desktop Framework**: Tauri
- **Diagram Rendering**: Mermaid.js

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

2. Install frontend dependencies:
```bash
npm install
```

3. Install backend dependencies:
```bash
cd backend
npm install
cd ..
```

4. Install Rust dependencies (Tauri will handle this automatically, but you can also install Rust via [rustup](https://rustup.rs/))

## Development

To run the application in development mode:

```bash
npm run dev
```

This will:
- Start the backend server on `http://localhost:3001`
- Start the frontend Vite dev server on `http://localhost:5173`
- Launch the Tauri application

Alternatively, you can run them separately:

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev:frontend

# Terminal 3: Tauri
npm run tauri dev
```

## Building

To build the application for production:

```bash
npm run build
```

This will:
- Build the frontend React app
- Build the backend TypeScript code
- Create the Tauri application bundle

The built application will be in `src-tauri/target/release/` (or `debug` for debug builds).

## Project Structure

```
MermaidUI/
├── src/                    # Frontend React application
│   ├── components/         # React components
│   ├── App.tsx             # Main app component
│   └── main.tsx            # Entry point
├── backend/                # Backend API server
│   ├── src/
│   │   ├── routes/         # API route handlers
│   │   ├── database.ts     # SQLite database setup
│   │   └── index.ts        # Express server
├── src-tauri/              # Tauri Rust code
│   ├── src/
│   │   └── main.rs         # Tauri entry point
│   └── Cargo.toml          # Rust dependencies
├── package.json            # Frontend dependencies
└── vite.config.ts          # Vite configuration
```

## API Endpoints

### Collections
- `GET /api/collections` - Get all collections
- `GET /api/collections/:id` - Get a specific collection
- `POST /api/collections` - Create a new collection
- `PUT /api/collections/:id` - Update a collection
- `DELETE /api/collections/:id` - Delete a collection

### Diagrams
- `GET /api/diagrams/collection/:collectionId` - Get all diagrams in a collection
- `GET /api/diagrams/:id` - Get a specific diagram
- `POST /api/diagrams` - Create a new diagram
- `PUT /api/diagrams/:id` - Update a diagram
- `DELETE /api/diagrams/:id` - Delete a diagram
- `POST /api/diagrams/upload` - Upload a Mermaid file

### Export
- `POST /api/export/svg/:id` - Export diagram as SVG
- `POST /api/export/png/:id` - Export diagram as PNG
- `POST /api/export/pdf/:id` - Export diagram as PDF

## Database

The application uses SQLite for persistence. The database file (`mermaid-ui.db`) will be created automatically in the project root directory when you first run the application.

## License

MIT

