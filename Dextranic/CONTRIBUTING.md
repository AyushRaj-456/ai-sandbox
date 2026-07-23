# Contributing to Dextranic

First off — thank you for taking the time to contribute! 🎉

Dextranic is an open-source Presentation-as-Code platform, and it grows through community involvement. Whether you're fixing a bug, improving documentation, adding a new `.dex` block type, or proposing a new feature — you're making Dextranic better for everyone.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [How to Contribute](#how-to-contribute)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Commit Message Convention](#commit-message-convention)
- [Pull Request Process](#pull-request-process)
- [Reporting Bugs](#reporting-bugs)
- [Suggesting Features](#suggesting-features)
- [Good First Issues](#good-first-issues)

---

## Code of Conduct

Be kind, inclusive, and professional. We follow the [Contributor Covenant](https://www.contributor-covenant.org/) Code of Conduct. Harassment, discrimination, or disrespectful behavior will not be tolerated.

---

## How to Contribute

### Ways to contribute

| Type | How |
|---|---|
| 🐛 Bug fix | Open an issue, then submit a PR |
| ✨ New feature | Open a discussion first, then PR |
| 📖 Documentation | Direct PR welcome |
| 🎨 New template | Open a PR adding to `src/data/` |
| 🧪 Tests | Direct PR welcome |
| 🌐 Translation | Open a discussion first |

---

## Development Setup

### Prerequisites

- **Node.js** v18+
- **npm** v9+
- A modern browser

### Steps

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/<your-username>/dextranic.git
cd dextranic

# 3. Add upstream remote
git remote add upstream https://github.com/AyushRaj-456/dextranic.git

# 4. Install dependencies
npm install

# 5. Set up environment variables
cp .env.example .env.local
# Fill in Firebase credentials — or leave blank for offline/mock mode

# 6. Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). 

> **No Firebase needed!** Dextranic runs fully offline in mock mode when credentials are not provided.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (pages, global styles)
├── compiler/               # .dex DSL compiler pipeline
│   ├── lexer.ts            # Tokenizer
│   ├── parser.ts           # AST builder
│   ├── ast.ts              # Node type definitions
│   ├── semantic-analyzer.ts # Import resolver & validator
│   ├── rich-text-parser.ts # Inline markdown/color/math parser
│   ├── outline-parser.ts   # Slide structure extractor
│   └── formatter.ts        # Code formatter
├── renderers/              # Output systems
│   ├── live-preview.tsx    # Real-time React slide renderer
│   └── pptx-compiler.ts   # PptxGenJS PPTX export engine
├── components/             # IDE UI components
├── context/                # React Context (global project state)
├── utils/                  # Firebase, IndexedDB helpers
├── data/                   # Static template data
└── types.ts                # Shared TypeScript interfaces
```

### Key Architectural Concepts

**Compiler Pipeline:**  
`.dex` source → `Lexer` → tokens → `Parser` → AST → `SemanticAnalyzer` → resolved AST → (`LivePreview` | `PptxCompiler`)

**Project State:**  
All open files, tabs, and logs live in `ProjectContext`. Components consume this via `useProject()`.

**Mock Mode:**  
When Firebase credentials are missing, `isMockMode` in `firebase.ts` is `true`. All Firebase functions gracefully fall back to localStorage/mock data, so the full app is usable offline.

---

## Coding Standards

### TypeScript

- All new code must be **TypeScript** (`.ts` / `.tsx`)
- Avoid `any` where possible — use proper types or generics
- Use the types defined in `src/types.ts` for shared structures
- Add JSDoc comments to exported functions and complex logic

### React Components

- Use **functional components** with hooks only
- Use **CSS Modules** for component styles (`.module.css`)
- Follow the existing component file naming: `PascalCase.tsx`
- Keep components focused — one responsibility per component
- Avoid inline styles except for dynamic/computed values

### CSS

- Use **CSS variables** from `globals.css` for colors and spacing
- Use **CSS Modules** — no global CSS inside component files
- Do not use Tailwind or other utility frameworks
- Prefer `rem` over `px` for font sizes; `px` is fine for borders/shadows

### Compiler Code

- Keep the compiler pipeline **pure and stateless** — no React imports
- Each compiler stage (`lexer`, `parser`, etc.) must be independently testable
- Add comments explaining non-obvious parsing logic
- AST nodes must be defined in `ast.ts`

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>
```

### Types

| Type | When to use |
|---|---|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code change that's not a fix or feature |
| `perf` | Performance improvement |
| `test` | Adding or updating tests |
| `chore` | Build process, dependency updates |

### Examples

```
feat(compiler): add video block type support
fix(editor): resolve undo stack reset on tab switch
docs(readme): add architecture diagram
chore(deps): update pptxgenjs to v3.13
```

---

## Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   ```

2. **Make your changes** following the coding standards above.

3. **Test your changes** — run the app locally and verify nothing is broken:
   ```bash
   npm run dev
   npm run lint
   npx tsc --noEmit
   ```

4. **Commit** using conventional commit messages.

5. **Push and open a PR** against the `main` branch.

6. **Fill out the PR template** — describe what changed and why.

7. **Wait for review** — a maintainer will review within a few days.

### PR Checklist

- [ ] My code follows the project's coding standards
- [ ] I have run `npx tsc --noEmit` with no errors
- [ ] I have run `npm run lint` with no errors
- [ ] I have tested the changes in the browser
- [ ] I have not committed `.env.local` or any credentials
- [ ] I have updated documentation if needed

---

## Reporting Bugs

1. **Search existing issues** — the bug may already be reported.
2. **Open a new issue** using the Bug Report template.
3. Include:
   - Steps to reproduce
   - Expected behavior
   - Actual behavior
   - Browser & OS
   - Screenshots or error messages if applicable

---

## Suggesting Features

1. **Check the roadmap** in `README.md` and existing issues.
2. **Open a Discussion** (not an issue) to propose and discuss the idea.
3. Once there's consensus, open an issue and optionally submit a PR.

Large features should be discussed before implementation to avoid wasted effort.

---

## Good First Issues

New to the project? Look for issues tagged:

- [`good first issue`](../../issues?q=label:"good+first+issue") — beginner-friendly tasks
- [`documentation`](../../issues?q=label:"documentation") — docs improvements
- [`help wanted`](../../issues?q=label:"help+wanted") — maintainer-requested contributions

---

## Questions?

Open a [GitHub Discussion](../../discussions) — we're happy to help!

---

_Thank you for helping make Dextranic better. Every contribution matters._ 💙
