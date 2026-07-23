# Dextranic — Changelog

All notable changes to this project will be documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).  
Versions follow [Semantic Versioning](https://semver.org/).

---

## [0.5.0-beta] — 2026-05-20

### Added
- Firebase-backed Community Hub with template publishing
- User authentication (email/password + Google OAuth)
- Profile dashboard with avatar display
- Community template like, download (ZIP), and clone functionality
- Publish Template workflow — editor-first flow with guided publish button
- ZIP export of community templates
- Like deduplication using localStorage tracking

### Changed
- Landing page navigation centered and cleaned up
- Template grid updated to `auto-fill` layout for better responsiveness
- Duplicate DEXTRANIC IDE logo removed from secondary nav

### Fixed
- Undo/Redo stack now isolated per file via Monaco `path` prop
- `updateFile` import missing from EditorTabs
- DOM hydration error from Fast Refresh during hot module replacement

---

## [0.4.0] — 2026-05

### Added
- Starter template gallery with categories: Startup Pitch, Tech & Data, Academic, Creative Keynote
- Template hover preview animation with mini slide renderer
- One-click template loading into the IDE workspace
- Template loading overlay with animated spinner
- Command Palette (VS Code-style) with search and keyboard shortcut
- Help Drawer with keyboard shortcut reference

### Changed
- IDE split into resizable panel layout using `react-resizable-panels`
- Sidebar enhanced with Slides outline tab

---

## [0.3.0] — 2026-05

### Added
- Rich text inline parser: **bold**, *italic*, `code`, `\color{}{}`, `\bold{}`
- LaTeX-style math equation block rendering
- Code block with syntax-highlighted monospace rendering
- Diagram flowchart block with arrow rendering
- Chart block: bar chart visualization
- Table block with header/row parsing

### Changed
- Live preview fully rebuilt — slide-by-slide scrollable renderer
- PPTX compiler extended with all new block types

---

## [0.2.0] — 2026-04

### Added
- Multi-file project support with IDE workspace
- File explorer (Sidebar) with create, rename, delete, duplicate, move
- Editor tab system with pinning, drag reorder, context menu, search
- Monaco Editor integration with `.dex` language definition
- Syntax highlighting, autocomplete, and bracket colorization
- Terminal log panel (compiler output)
- IndexedDB workspace persistence
- ZIP import/export of full project workspace
- Keyboard shortcuts: `Ctrl+B`, `Ctrl+J`, `Ctrl+S`, `Ctrl+N`, etc.

---

## [0.1.0] — 2026-03

### Added
- Initial `.dex` DSL design
- Lexer, Parser, and AST implementation
- Basic slide rendering: `theme`, `slide`, `title`, `bullets`
- First PPTX compilation via PptxGenJS
- Landing page and hero playground
