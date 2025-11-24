# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2025-01-XX

### Added
- **Zoom controls**: Added zoom in/out, reset, and zoom level display for diagram preview
- **Click-and-drag scrolling**: Pan around zoomed diagrams by clicking and dragging
- **SVG export**: Export rendered diagrams as SVG files with file dialog for save location
- **Mermaid source export**: Export Mermaid source code as .mmd files
- **Separated headers**: Editor and preview panes now have dedicated header controls

### Fixed
- **State preservation**: CollectionsBrowser no longer loses state when sidebar collapses
- **Scrolling behavior**: Large diagrams now properly show scrollbars and maintain padding
- **Layout improvements**: Better responsive design for full-screen diagram viewing

### Changed
- **Export icons**: Updated from save icon to download icons for better user experience
- **Control layout**: Zoom controls moved to preview header, editor controls to editor header

## [1.1.0] - 2025-01-XX

### Fixed
- **CollectionsBrowser state preservation**: Fixed critical issue where CollectionsBrowser would unmount when sidebar collapses, causing loss of all internal state including:
  - Partially filled collection forms (name, description inputs)
  - File upload progress indicators
  - Open modal dialogs (delete confirmations)
  - User selections and form data
- **User experience improvement**: Now uses CSS-based hiding instead of conditional rendering to preserve component state during sidebar collapse/expand cycles
- **No data loss**: Users no longer lose unsaved work when toggling sidebar visibility

## [1.0.0] - 2025-01-XX

### Added
- Collections management (create, edit, delete)
- Diagram editor with CodeMirror syntax highlighting
- Live Mermaid diagram preview
- Resizable split pane with hide/show functionality
- File upload support for .mmd and .mermaid files
- Auto-save toggle for content changes
- Tauri IPC backend with Rust database operations
- SQLite database persistence in app data directory

[Unreleased]: https://github.com/buchenberg/MermaidUI/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/buchenberg/MermaidUI/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/buchenberg/MermaidUI/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/buchenberg/MermaidUI/releases/tag/v1.0.0

