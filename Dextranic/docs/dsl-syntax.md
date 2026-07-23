# Dextranic DSL — Syntax Reference

> Complete reference for the `.dex` (Dextranic Expression) language.

---

## Table of Contents

- [Overview](#overview)
- [File Structure](#file-structure)
- [Theme Block](#theme-block)
- [Slide Block](#slide-block)
- [Text Block](#text-block)
- [Bullets Block](#bullets-block)
- [Image Block](#image-block)
- [Table Block](#table-block)
- [Chart Block](#chart-block)
- [Diagram Block](#diagram-block)
- [Code Block](#code-block)
- [Equation Block](#equation-block)
- [Rich Text Formatting](#rich-text-formatting)
- [Multi-File Imports](#multi-file-imports)

---

## Overview

Dextranic uses a custom declarative DSL called `.dex`. Every presentation is described as a series of structured blocks. The compiler converts these blocks into a native `.pptx` file.

```dex
theme {
    primary: "#0f172a"
    secondary: "#38bdf8"
    font: "Inter"
}

slide {
    title: "Hello, Dextranic"
    bullets {
        "First point"
        "Second point"
    }
}
```

---

## File Structure

A `.dex` project typically has:

```
main.dex          ← entry point (theme + imports)
slides/
  intro.dex       ← individual slide files
  data.dex
  conclusion.dex
```

### Entry Point (`main.dex`)

```dex
presentation {
    title: "My Deck"
}

theme {
    primary: "#0f172a"
    secondary: "#38bdf8"
    font: "Poppins"
}

import "slides/intro.dex"
import "slides/data.dex"
```

---

## Theme Block

Defines the global visual theme applied to all slides.

```dex
theme {
    primary: "#0f172a"     # Background color of all slides
    secondary: "#38bdf8"   # Accent color for highlights
    font: "Inter"          # Google Font family name
}
```

| Property | Type | Description |
|---|---|---|
| `primary` | hex color string | Slide background color |
| `secondary` | hex color string | Accent/highlight color |
| `font` | string | Google Font name |

---

## Slide Block

Container for a single slide. Must contain at least a `title`.

```dex
slide {
    title: "Slide Title"
    # ... content blocks
}
```

---

## Text Block

Renders a styled rich text block on the slide.

```dex
text {
    content: "Custom styled content"
    size: "24"
    color: "#38bdf8"
    align: "center"        # left | center | right
    font: "Poppins"
    shadow: "true"
}
```

| Property | Type | Description |
|---|---|---|
| `content` | string | Text to display (supports rich text) |
| `size` | number string | Font size in points |
| `color` | hex color | Text color |
| `align` | string | `left`, `center`, or `right` |
| `font` | string | Override font family |
| `shadow` | boolean string | Add text shadow |

---

## Bullets Block

Renders a bullet point list.

```dex
bullets {
    "First bullet point"
    "Second bullet with **bold** text"
    "Third with *italic* and `code`"
}
```

Each string is a separate bullet. Supports [Rich Text Formatting](#rich-text-formatting).

---

## Image Block

Embeds an image on the slide.

```dex
image {
    src: "./assets/logo.png"
    width: "450"
    align: "center"     # left | center | right
}
```

| Property | Type | Description |
|---|---|---|
| `src` | path string | Relative path to the image file |
| `width` | number string | Image width in pixels |
| `align` | string | Horizontal alignment |

---

## Table Block

Renders a structured data table.

```dex
table {
    headers: "Feature, Standard, Dextranic"
    rows: "Version Control | No | Yes; Custom Branding | No | Yes"
}
```

- `headers`: comma-separated column names
- `rows`: semicolon-separated rows; cells separated by ` | `

---

## Chart Block

Renders a bar chart visualization.

```dex
chart {
    type: "bar"
    title: "Quarterly Performance"
    labels: "Q1, Q2, Q3, Q4"
    data: "45, 60, 50, 75"
}
```

| Property | Type | Description |
|---|---|---|
| `type` | string | Chart type: `bar` (more types coming) |
| `title` | string | Chart heading |
| `labels` | comma-separated strings | X-axis labels |
| `data` | comma-separated numbers | Data values |

---

## Diagram Block

Renders a flowchart diagram.

```dex
diagram flowchart {
    "Input" -> "Process"
    "Process" -> "Output"
    "Process" -> "Error Handler"
}
```

Each line defines a directed edge: `"Node A" -> "Node B"`

---

## Code Block

Renders a syntax-highlighted code block.

```dex
code {
    language: "typescript"
    content: "const dextranic = true;\nconsole.log('Hello!');"
}
```

| Property | Type | Description |
|---|---|---|
| `language` | string | Syntax language (e.g. `python`, `typescript`, `rust`) |
| `content` | string | Code content (use `\n` for newlines) |

---

## Equation Block

Renders a mathematical equation using LaTeX-style syntax.

```dex
equation {
    formula: "E = mc^2"
}
```

```dex
equation {
    formula: "\int_a^b f(x)\,dx = F(b) - F(a)"
}
```

---

## Rich Text Formatting

Inline formatting can be used inside `bullets`, `text`, and `title` strings:

| Syntax | Output |
|---|---|
| `**bold**` | **bold** |
| `*italic*` | *italic* |
| `` `code` `` | `inline code` |
| `\bold{text}` | **bold** (alternative) |
| `\color{F43F5E}{red text}` | Colored text |

---

## Multi-File Imports

Split your presentation across multiple `.dex` files:

```dex
# main.dex
import "slides/intro.dex"
import "slides/architecture.dex"
import "slides/conclusion.dex"
```

The compiler resolves all imports and compiles them into a single presentation in order.
