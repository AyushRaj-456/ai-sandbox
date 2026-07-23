# Dextranic — Compiler Architecture

> A deep-dive into how Dextranic compiles `.dex` source code into native PPTX files.

---

## Overview

Dextranic implements a complete **multi-stage compiler pipeline** from scratch in TypeScript. The pipeline is:

```
.dex source code
      │
      ▼
  [1] Lexer          (src/compiler/lexer.ts)
      │  → Token stream
      ▼
  [2] Parser         (src/compiler/parser.ts)
      │  → Abstract Syntax Tree (AST)
      ▼
  [3] Semantic Analyzer (src/compiler/semantic-analyzer.ts)
      │  → Resolved & validated AST
      ▼
      ├──────────────────────────┐
      ▼                          ▼
  [4a] Live Preview          [4b] PPTX Compiler
  (renderers/live-preview.tsx) (renderers/pptx-compiler.ts)
      │                          │
      ▼                          ▼
  React slide render        PptxGenJS → .pptx download
```

---

## Stage 1: Lexer (`lexer.ts`)

The Lexer reads raw `.dex` source text and converts it into a **flat stream of typed tokens**.

### Token Types

| Token | Example |
|---|---|
| `KEYWORD` | `slide`, `theme`, `bullets` |
| `STRING` | `"Hello World"` |
| `LBRACE` / `RBRACE` | `{` / `}` |
| `ARROW` | `->` |
| `IDENTIFIER` | `primary`, `font` |
| `COLON` | `:` |
| `EOF` | End of file |

### Example

Input:
```dex
slide {
    title: "My Slide"
}
```

Token stream:
```
KEYWORD("slide")
LBRACE
IDENTIFIER("title")
COLON
STRING("My Slide")
RBRACE
```

---

## Stage 2: Parser (`parser.ts`)

The Parser consumes the token stream and builds an **Abstract Syntax Tree (AST)** — a nested object structure representing the presentation.

### AST Node Types (defined in `ast.ts`)

```typescript
PresentationNode
  └── ThemeNode
  └── SlideNode[]
        └── TitleNode
        └── BulletsNode
        └── TextNode
        └── ImageNode
        └── TableNode
        └── ChartNode
        └── DiagramNode
        └── CodeNode
        └── EquationNode
```

### Example AST

```json
{
  "type": "Presentation",
  "theme": {
    "primary": "#0f172a",
    "secondary": "#38bdf8",
    "font": "Inter"
  },
  "slides": [
    {
      "type": "Slide",
      "title": "My Slide",
      "content": []
    }
  ]
}
```

---

## Stage 3: Semantic Analyzer (`semantic-analyzer.ts`)

The Semantic Analyzer handles:

1. **Multi-file import resolution** — `import "slides/intro.dex"` is resolved by reading the referenced file and recursively parsing it
2. **AST merging** — slides from imported files are appended to the main presentation AST
3. **Source file tracking** — each slide node is tagged with its `sourceFile` for the live preview to highlight the active file

The Semantic Analyzer receives the full `ProjectFile[]` array from the IDE, which lets it resolve imports from the virtual in-memory filesystem.

---

## Stage 4a: Live Preview (`live-preview.tsx`)

The Live Preview renders the resolved AST as **React components** in real time:

- Subscribes to AST changes via `useMemo`
- Maps each slide node to a `<SlidePreview>` component
- Supports both **scroll mode** (all slides) and **presentation mode** (one slide at a time)
- Applies theme colors via **CSS custom properties** (`--slide-bg`, `--slide-color`, etc.)

---

## Stage 4b: PPTX Compiler (`pptx-compiler.ts`)

The PPTX Compiler converts the AST into a native `.pptx` file using [PptxGenJS](https://gitbrent.github.io/PptxGenJS/):

### Compilation Process

For each `SlideNode`:
1. Creates a new PptxGenJS slide
2. Applies the `ThemeNode` background and font
3. For each content node:
   - `TitleNode` → `addText()` with position/size
   - `BulletsNode` → `addText()` with bullet formatting
   - `TextNode` → `addText()` with custom style props
   - `TableNode` → `addTable()` with header/row data
   - `ChartNode` → `addChart()` with PptxGenJS chart API
   - `DiagramNode` → `addText()` with arrow characters
   - `CodeNode` → `addText()` in monospace font
   - `ImageNode` → `addImage()` (base64 encoded)
   - `EquationNode` → `addText()` with equation styling

4. Calls `pptx.writeFile()` to trigger browser download

### Output

The resulting `.pptx` file contains **100% native OpenXML shapes** — fully editable in PowerPoint, Keynote, and Google Slides.

---

## Rich Text Parser (`rich-text-parser.ts`)

Handles inline formatting within string values:

| Input | Output |
|---|---|
| `**bold**` | `bold: true` in PptxGenJS run |
| `*italic*` | `italic: true` in PptxGenJS run |
| `` `code` `` | `fontFace: 'Courier New'` run |
| `\color{F43F5E}{text}` | `color: 'F43F5E'` run |
| `\bold{text}` | `bold: true` run |

Returns an array of **text run objects** compatible with both the React renderer and PptxGenJS.

---

## Formatter (`formatter.ts`)

The Formatter provides auto-formatting for `.dex` files triggered by Shift+Alt+F in the IDE. It normalizes:
- Indentation (2 spaces per block level)
- Consistent quote styles
- Block spacing
