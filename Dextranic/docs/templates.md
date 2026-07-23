# Dextranic — Template System

> How the template gallery and Community Hub work.

---

## Built-in Template Gallery

Located in `src/data/`, the built-in templates are static JavaScript objects containing pre-authored `.dex` file arrays.

### Template Structure

Each template is an object with:

```typescript
{
  id: string,          // unique template identifier
  title: string,       // display name
  category: string,    // "Startup Pitch" | "Tech & Data" | etc.
  desc: string,        // short description
  files: ProjectFile[] // array of .dex file objects
}
```

### Adding a New Built-in Template

1. Open `src/data/` and find the templates array
2. Add a new object following the structure above
3. Include at least a `main.dex` file with `theme {}` and one `slide {}`
4. Add slide content files if multi-file

---

## Community Hub Templates

The Community Hub uses **Firebase Firestore** to store user-published templates.

### Publishing Flow

1. User creates a presentation in the IDE
2. Clicks **"Publish to Hub"** in the Top Menu Bar
3. Fill in the template title, description, category, and tags
4. Template files are serialized and saved to Firestore
5. The template appears in the Community Hub grid

### Template Document Schema (Firestore)

```typescript
{
  templateId: string,     // auto-generated UUID
  title: string,
  description: string,
  category: string,
  tags: string[],
  creatorName: string,
  creatorAvatar: string,
  thumbnailUrl: string,
  files: Array<{
    name: string,
    content: string
  }>,
  likes: number,
  downloads: number,
  createdAt: Timestamp
}
```

### Cloning a Template

When a user clicks "Clone" on a Community Hub template:
1. The template files are loaded into the IDE workspace
2. The user can edit and modify the template locally
3. They can then publish their modified version

---

## Mock Templates

In Mock Mode (no Firebase), Community Hub shows built-in mock templates defined in `src/utils/firebase.ts` under the `getMockCommunityDecks()` function.
