# Firebase Setup Guide

> How to configure Firebase for Dextranic Community Hub features.

---

## Overview

Dextranic works **fully offline without Firebase**. When no Firebase credentials are provided, it automatically runs in **Mock Mode** — all auth, community templates, and profiles are simulated locally using localStorage.

Firebase is only required if you want to:
- Use real user accounts (sign up, log in)
- Publish templates to the Community Hub
- Share templates with other users

---

## Step 1: Create a Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name (e.g. `dextranic-dev`)
4. Disable Google Analytics (optional)
5. Click **"Create project"**

---

## Step 2: Register a Web App

1. In Firebase Console, click the **Web** icon (`</>`) to add a web app
2. Enter an app nickname (e.g. `Dextranic Web`)
3. Click **"Register app"**
4. Copy the `firebaseConfig` object shown — you'll need these values

---

## Step 3: Enable Authentication

1. In Firebase Console → **Authentication** → **Sign-in method**
2. Enable **Email/Password**
3. Optionally enable **Google**

---

## Step 4: Set Up Firestore Database

1. In Firebase Console → **Firestore Database** → **Create database**
2. Start in **test mode** (for development)
3. Choose a region close to your users

### Firestore Security Rules (Development)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> ⚠️ For production, write proper security rules that restrict access.

---

## Step 5: Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your Firebase config values:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

---

## Step 6: Restart the Dev Server

```bash
npm run dev
```

Dextranic will automatically detect the credentials and disable Mock Mode.

---

## Mock Mode

When credentials are empty or missing, `isMockMode = true` in `src/utils/firebase.ts`.

In Mock Mode:
- Sign Up creates a user profile in localStorage
- Sign In checks against localStorage
- Community templates load from built-in mock data
- All workspace data is saved to IndexedDB locally

This allows contributors to work on the full app without any Firebase account.
