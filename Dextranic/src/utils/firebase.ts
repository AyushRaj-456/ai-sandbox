import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// -------------------------------------------------------------
// FIREBASE CONFIGURATION
// Values are read from environment variables.
// Copy `.env.example` to `.env.local` and fill in your credentials.
// If credentials are missing, Dextranic runs in offline Mock Mode.
// See: docs/firebase-setup.md
// -------------------------------------------------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
};

// Check if credentials are configured — if not, run in offline Mock Mode
export const isMockMode =
  !firebaseConfig.apiKey ||
  firebaseConfig.apiKey.startsWith("YOUR_FIREBASE_") ||
  typeof window === "undefined";

let firebaseApp: any = null;
let activeAuth: any = null;
let activeDb: any = null;
let activeStorage: any = null;

if (!isMockMode) {
  try {
    firebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    activeAuth = getAuth(firebaseApp);
    activeDb = getFirestore(firebaseApp);
    activeStorage = getStorage(firebaseApp);
  } catch (error) {
    console.warn("Failed to initialize active Firebase client, falling back to Mock Simulator:", error);
  }
}

export const auth = activeAuth;
export const db = activeDb;
export const storage = activeStorage;

// =============================================================
// MOCK SIMULATOR DRIVER (LocalStorage-Backed Ecosystem)
// =============================================================

export interface UserProfile {
  uid: string;
  username: string;
  email: string;
  avatarUrl: string;
  createdAt: number;
}

export interface TemplateDeck {
  templateId: string;
  title: string;
  description: string;
  category: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  tags: string[];
  thumbnailUrl: string;
  zipUrl: string;
  createdAt: number;
  downloads: number;
  likes: number;
  files: { name: string; content: string }[];
}

// Initial seed templates for a populated Community Hub
const SEED_TEMPLATES: TemplateDeck[] = [
  {
    templateId: "ai-seed-1",
    title: "Quantum Neural Networks",
    description: "Immersive dark cyber slides displaying complex neural node diagrams and fuchsia gradients.",
    category: "AI Startup",
    creatorId: "ayush_auth_123",
    creatorName: "Ayush K.",
    creatorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=ayush",
    tags: ["neural", "cyberpunk", "future"],
    thumbnailUrl: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800",
    zipUrl: "",
    createdAt: Date.now() - 86400000 * 2,
    downloads: 142,
    likes: 58,
    files: [
      {
        name: "main.dex",
        content: `theme {
  primary: "#030712"
  secondary: "#ec4899"
  font: "Outfit"
}

import "cover.dex"
import "vision.dex"
`
      },
      {
        name: "cover.dex",
        content: `slide {
  title: "NEURAL NODE"
  layout: "centered"
  mesh: "cyberpunk"
  typography: "cinematic"
  decorations: "rings,grid"
  bgText: "QUANTUM"
  bgTextSize: "150"
  animate: "blur-reveal"
  text {
    content: "Advanced Cognitive Processing Systems"
    align: "center"
    size: "22"
    color: "#ec4899"
  }
}`
      },
      {
        name: "vision.dex",
        content: `slide {
  title: "Synaptic Topology"
  layout: "split-left"
  background: "#030712"
  decorations: "grid"
  image {
    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"
  }
  bullets {
    "Direct P2P compile execution."
    "Sub-millisecond latency curves."
  }
}`
      }
    ]
  },
  {
    templateId: "lux-seed-2",
    title: "Onyx Architectural Spec",
    description: "Premium editorial slideshow focusing on spacious layouts, ivory accents, and carbon-steel detailing.",
    category: "Minimal Keynote",
    creatorId: "emily_auth_456",
    creatorName: "Emily S.",
    creatorAvatar: "https://api.dicebear.com/7.x/bottts/svg?seed=emily",
    tags: ["luxury", "architecture", "minimalist"],
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800",
    zipUrl: "",
    createdAt: Date.now() - 86400000 * 5,
    downloads: 89,
    likes: 31,
    files: [
      {
        name: "main.dex",
        content: `theme {
  primary: "#050505"
  secondary: "#ffffff"
  font: "Outfit"
}

import "cover.dex"
import "philosophy.dex"
`
      },
      {
        name: "cover.dex",
        content: `slide {
  title: "ONYX STRUCTURE"
  layout: "centered"
  background: "#000000"
  typography: "cinematic"
  accent: "#ffffff"
  animate: "cinematic-zoom"
  bgText: "ONYX"
  text {
    content: "Minimal Environmental Architectures"
    align: "center"
    size: "20"
    color: "#a1a1aa"
  }
}`
      },
      {
        name: "philosophy.dex",
        content: `slide {
  title: "Whitespace Spacing"
  layout: "asymmetric-left"
  background: "#111111"
  decorations: "rings"
  bullets {
    "Integrating Physical Concrete Curves."
    "Spatial volume balances typography."
  }
}`
      }
    ]
  }
];

// Helper functions for auth state
export const getStoredAuth = (): UserProfile | null => {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("dextranic_auth_session");
  return stored ? JSON.parse(stored) : null;
};

export const setStoredAuth = (user: UserProfile | null) => {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem("dextranic_auth_session", JSON.stringify(user));
  } else {
    localStorage.removeItem("dextranic_auth_session");
  }
};

// Fetch community templates (handles Firestore vs local storage mock database)
export const fetchCommunityTemplates = async (): Promise<TemplateDeck[]> => {
  if (isMockMode) {
    if (typeof window === "undefined") return SEED_TEMPLATES;
    const stored = localStorage.getItem("dextranic_community_hub");
    if (!stored) {
      localStorage.setItem("dextranic_community_hub", JSON.stringify(SEED_TEMPLATES));
      return SEED_TEMPLATES;
    }
    return JSON.parse(stored);
  }

  // Real Firestore Query will execute here once valid keys are provided
  try {
    const { collection, getDocs, query, orderBy } = await import("firebase/firestore");
    const q = query(collection(activeDb, "templates"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const results: TemplateDeck[] = [];
    snapshot.forEach((doc) => {
      results.push(doc.data() as TemplateDeck);
    });
    return results.length > 0 ? results : SEED_TEMPLATES;
  } catch (err) {
    console.error("Firestore read error, falling back to seed templates:", err);
    return SEED_TEMPLATES;
  }
};

// Upload Template (handles Firestore vs local storage mock database)
export const uploadTemplateDeck = async (deck: Omit<TemplateDeck, "templateId" | "createdAt" | "downloads" | "likes">): Promise<TemplateDeck> => {
  const newDeck: TemplateDeck = {
    ...deck,
    templateId: `deck_${Math.random().toString(36).substring(2, 11)}`,
    createdAt: Date.now(),
    downloads: 0,
    likes: 0
  };

  if (isMockMode) {
    const current = await fetchCommunityTemplates();
    const updated = [newDeck, ...current];
    localStorage.setItem("dextranic_community_hub", JSON.stringify(updated));
    return newDeck;
  }

  // Real Firestore Upload will execute here once valid keys are provided
  try {
    const { doc, setDoc } = await import("firebase/firestore");
    await setDoc(doc(activeDb, "templates", newDeck.templateId), newDeck);
    return newDeck;
  } catch (err) {
    console.error("Firestore upload failed, saving to local simulator:", err);
    const current = await fetchCommunityTemplates();
    localStorage.setItem("dextranic_community_hub", JSON.stringify([newDeck, ...current]));
    return newDeck;
  }
};

// Sign Up User (handles Firebase Auth vs Local Mock)
export const signUpUser = async (username: string, email: string, password: string): Promise<UserProfile> => {
  if (isMockMode) {
    const profile: UserProfile = {
      uid: `usr_${Math.random().toString(36).substring(2, 11)}`,
      username,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
      createdAt: Date.now()
    };
    setStoredAuth(profile);
    return profile;
  }

  // Real Firebase Auth Signup
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  const { doc, setDoc } = await import("firebase/firestore");
  const credential = await createUserWithEmailAndPassword(activeAuth, email, password);
  const profile: UserProfile = {
    uid: credential.user.uid,
    username,
    email,
    avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
    createdAt: Date.now()
  };

  // Save profile to Firestore
  await setDoc(doc(activeDb, "users", profile.uid), profile);
  setStoredAuth(profile);
  return profile;
};

// Sign In User (handles Firebase Auth vs Local Mock)
export const signInUser = async (email: string, password: string): Promise<UserProfile> => {
  if (isMockMode) {
    const namePart = email.split("@")[0];
    const profile: UserProfile = {
      uid: `usr_${Math.random().toString(36).substring(2, 11)}`,
      username: namePart,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${namePart}`,
      createdAt: Date.now()
    };
    setStoredAuth(profile);
    return profile;
  }

  // Real Firebase Auth Signin
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const { doc, getDoc } = await import("firebase/firestore");
  const credential = await signInWithEmailAndPassword(activeAuth, email, password);

  // Read profile details from Firestore
  const docRef = doc(activeDb, "users", credential.user.uid);
  const docSnap = await getDoc(docRef);

  let profile: UserProfile;
  if (docSnap.exists()) {
    profile = docSnap.data() as UserProfile;
  } else {
    profile = {
      uid: credential.user.uid,
      username: email.split("@")[0],
      email,
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${credential.user.uid}`,
      createdAt: Date.now()
    };
  }

  setStoredAuth(profile);
  return profile;
};

// Log Out User (handles Firebase Auth vs Local Mock)
export const signOutUser = async (): Promise<void> => {
  if (!isMockMode) {
    const { signOut } = await import("firebase/auth");
    await signOut(activeAuth);
  }
  setStoredAuth(null);
};

// Increment Template Likes
export const likeCommunityTemplate = async (templateId: string): Promise<void> => {
  if (isMockMode) {
    const current = await fetchCommunityTemplates();
    const updated = current.map(t => t.templateId === templateId ? { ...t, likes: t.likes + 1 } : t);
    localStorage.setItem("dextranic_community_hub", JSON.stringify(updated));
    return;
  }
  try {
    const { doc, updateDoc, increment } = await import("firebase/firestore");
    await updateDoc(doc(activeDb, "templates", templateId), {
      likes: increment(1)
    });
  } catch (err) {
    console.error("Firestore like failed:", err);
    const current = await fetchCommunityTemplates();
    const updated = current.map(t => t.templateId === templateId ? { ...t, likes: t.likes + 1 } : t);
    localStorage.setItem("dextranic_community_hub", JSON.stringify(updated));
  }
};

// Increment Template Downloads
export const trackCommunityDownload = async (templateId: string): Promise<void> => {
  if (isMockMode) {
    const current = await fetchCommunityTemplates();
    const updated = current.map(t => t.templateId === templateId ? { ...t, downloads: t.downloads + 1 } : t);
    localStorage.setItem("dextranic_community_hub", JSON.stringify(updated));
    return;
  }
  try {
    const { doc, updateDoc, increment } = await import("firebase/firestore");
    await updateDoc(doc(activeDb, "templates", templateId), {
      downloads: increment(1)
    });
  } catch (err) {
    console.error("Firestore download track failed:", err);
    const current = await fetchCommunityTemplates();
    const updated = current.map(t => t.templateId === templateId ? { ...t, downloads: t.downloads + 1 } : t);
    localStorage.setItem("dextranic_community_hub", JSON.stringify(updated));
  }
};

