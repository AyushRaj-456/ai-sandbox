export interface TemplateFile {
  id: string;
  name: string;
  type: 'file';
  content: string;
  parentId?: string | null;
}

export interface Template {
  id: string;
  title: string;
  desc: string;
  name: string;
  category: string;
  files: TemplateFile[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'ai-startup',
    title: 'Futuristic AI Startup',
    desc: 'Cutting-edge cyberpunk pitch deck featuring fuchsia animated mesh grids, glowing text outlines, abstract floating 3D rings, and structured neural specifications.',
    name: 'AI Startup',
    category: 'Startup Pitch Deck',
    files: [
      {
        id: 'ai-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#030712"
  secondary: "#ec4899"
  font: "Outfit"
}

import "cover.dex"
import "deficit.dex"
import "spec.dex"
import "pipeline.dex"
import "ask.dex"
`,
        parentId: null
      },
      {
        id: 'ai-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "COGNITIVE"
  layout: "centered"
  mesh: "cyberpunk"
  typography: "cinematic"
  decorations: "rings,grid"
  bgText: "SYNAPSE"
  bgTextSize: "160"
  animate: "blur-reveal"
  text {
    content: "Autonomous Agentic Reasoning Architectures"
    align: "center"
    size: "22"
    color: "#ec4899"
  }
}`,
        parentId: null
      },
      {
        id: 'ai-deficit',
        name: 'deficit.dex',
        type: 'file',
        content: `slide {
  title: "Reasoning Deficit"
  layout: "split-right"
  background: "#030712"
  decorations: "grid"
  image {
    src: "https://images.unsplash.com/photo-1677442136019-21780efad99a?w=800"
  }
  bullets {
    "Static LLM context maps lack long-term planning frameworks."
    "Subsequent iteration loops introduce heavy runtime latencies."
    "Traditional systems operate outside clean safety sandboxes."
  }
}`,
        parentId: null
      },
      {
        id: 'ai-spec',
        name: 'spec.dex',
        type: 'file',
        content: `slide {
  title: "System Specifications"
  layout: "asymmetric-left"
  background: "#030712"
  glass: "true"
  decorations: "sphere"
  table {
    headers: "Model, Context Length, Latency"
    rows: "Cognitive-Small | 32k tokens | 45ms; Cognitive-Medium | 128k tokens | 120ms; Cognitive-Reasoning | 1M tokens | 340ms"
  }
}`,
        parentId: null
      },
      {
        id: 'ai-pipeline',
        name: 'pipeline.dex',
        type: 'file',
        content: `slide {
  title: "Lifecycle Path"
  layout: "split-left"
  background: "#030712"
  decorations: "ribbon"
  chart {
    type: "bar"
    title: "Inference Latency Response (ms)"
    labels: "Static Pass, Semantic check, Graph Compile"
    data: "140, 280, 85"
  }
  bullets {
    "Graph compilation compiles intermediate states inside 85ms."
    "Sub-millisecond continuous feedback telemetry loops."
  }
}`,
        parentId: null
      },
      {
        id: 'ai-ask',
        name: 'ask.dex',
        type: 'file',
        content: `slide {
  title: "Accelerating Intelligence"
  layout: "full-hero"
  background: "https://images.unsplash.com/photo-1515263487990-61b07816b324?w=800"
  overlay: "true"
  animate: "cinematic-zoom"
  text {
    content: "We are raising $5M Seed capital to scale our compute cluster models and hire world-class compiler architects."
    align: "center"
    size: "24"
    color: "#f8fafc"
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'luxury-tech',
    title: 'Luxury Technology',
    desc: 'High-end pitch system utilizing deep onyx backgrounds, gold highlights, floating metallic rings, and editorial magazine whitespace.',
    name: 'Luxury Tech',
    category: 'Startup Pitch Deck',
    files: [
      {
        id: 'lux-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#000000"
  secondary: "#d4af37"
  font: "Outfit"
}

import "cover.dex"
import "vision.dex"
import "specs.dex"
`,
        parentId: null
      },
      {
        id: 'lux-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "CHROME"
  layout: "centered"
  background: "#000000"
  typography: "neon"
  accent: "#d4af37"
  decorations: "rings,sphere"
  bgText: "PREMIUM"
  bgTextSize: "180"
  animate: "blur-reveal"
  text {
    content: "Crafting Luxurious Structural Hardware"
    align: "center"
    size: "20"
    color: "#d4af37"
  }
}`,
        parentId: null
      },
      {
        id: 'lux-vision',
        name: 'vision.dex',
        type: 'file',
        content: `slide {
  title: "Philosophy of Craft"
  layout: "asymmetric-left"
  background: "#09090b"
  glass: "true"
  decorations: "sphere"
  bullets {
    "Remove redundant visual ornaments."
    "Maximize spatial whitespace margins."
    "Exquisite anodized carbon steel borders."
  }
}`,
        parentId: null
      },
      {
        id: 'lux-specs',
        name: 'specs.dex',
        type: 'file',
        content: `slide {
  title: "Anatomy of Detail"
  layout: "split-right"
  background: "#000000"
  image {
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
  }
  bullets {
    "Laser engraved custom emblems."
    "Sub-micron precision edge profiles."
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'cyberpunk-pitch',
    title: 'Cyberpunk Pitch Deck',
    desc: 'High-contrast glowing obsidian cards set against neon cyber highlights and monospaced tech grids.',
    name: 'Cyberpunk Pitch',
    category: 'Startup Pitch Deck',
    files: [
      {
        id: 'cyber-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#0b001a"
  secondary: "#f43f5e"
  font: "Outfit"
}

import "cover.dex"
import "vision.dex"
import "spec.dex"
`,
        parentId: null
      },
      {
        id: 'cyber-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "SYNAPSE"
  layout: "centered"
  background: "#0b001a"
  typography: "outlined"
  accent: "#f43f5e"
  decorations: "grid,rings"
  bgText: "NETWORKS"
  bgTextSize: "150"
  animate: "blur-reveal"
  text {
    content: "Decentralized Cognitive Grid Systems"
    align: "center"
    size: "20"
    color: "#f43f5e"
  }
}`,
        parentId: null
      },
      {
        id: 'cyber-vision',
        name: 'vision.dex',
        type: 'file',
        content: `slide {
  title: "Quantum Nodes Topology"
  layout: "split-left"
  background: "#0d001f"
  decorations: "grid"
  image {
    src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"
  }
  bullets {
    "P2P compiler execution channels."
    "Real-time state synchronization."
  }
}`,
        parentId: null
      },
      {
        id: 'cyber-spec',
        name: 'spec.dex',
        type: 'file',
        content: `slide {
  title: "Node Projections"
  layout: "asymmetric-left"
  background: "#0b001a"
  glass: "true"
  decorations: "sphere"
  table {
    headers: "Cluster, Bandwidth, Sync time"
    rows: "Synapse-A | 450 GB/s | 12ms; Synapse-B | 980 GB/s | 6ms; Synapse-C | 1.8 TB/s | 2ms"
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'apple-keynote',
    title: 'Apple Keynote Style',
    desc: 'Cinematic Apple launch presentation using dark full-bleed images, spacious magazine editorial fonts, and clean lines.',
    name: 'Apple Keynote',
    category: 'Apple Keynote Style',
    files: [
      {
        id: 'apple-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#000000"
  secondary: "#ffffff"
  font: "Outfit"
}

import "cover.dex"
import "vision.dex"
import "benchmarks.dex"
`,
        parentId: null
      },
      {
        id: 'apple-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "VELOCITY"
  layout: "centered"
  background: "#000000"
  typography: "cinematic"
  accent: "#ffffff"
  bgText: "PERFORMANCE"
  bgTextSize: "160"
  animate: "cinematic-zoom"
  text {
    content: "The Next Era of Computation Speed"
    align: "center"
    size: "22"
    color: "#a1a1aa"
  }
}`,
        parentId: null
      },
      {
        id: 'apple-vision',
        name: 'vision.dex',
        type: 'file',
        content: `slide {
  title: "Engineered Architecture"
  layout: "full-hero"
  background: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800"
  overlay: "true"
  animate: "cinematic-zoom"
  text {
    content: "Software is not just what compiles. It is about organizing creative paradigms with extreme processing speed."
    align: "center"
    size: "24"
    color: "#f4f4f5"
  }
}`,
        parentId: null
      },
      {
        id: 'apple-benchmarks',
        name: 'benchmarks.dex',
        type: 'file',
        content: `slide {
  title: "Computation Bounds"
  layout: "split-right"
  background: "#000000"
  chart {
    type: "line"
    title: "GFLOPS Throughput"
    labels: "Core V1, Core V2, Velocity v2"
    data: "220, 640, 1480"
  }
  bullets {
    "A massive 2.3x performance multiplier."
    "Optimized intermediate representation compilers."
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'minimal-cinematic',
    title: 'Minimal Cinematic',
    desc: 'Editorial luxury styling featuring extreme whitespace spacing, soft ivory white backgrounds, and oversized cropped backgrounds text.',
    name: 'Minimal Keynote',
    category: 'Minimal Cinematic',
    files: [
      {
        id: 'min-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#f8f9fa"
  secondary: "#1a1a1a"
  font: "Outfit"
}

import "cover.dex"
import "philosophy.dex"
import "metrics.dex"
`,
        parentId: null
      },
      {
        id: 'min-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "ESSENCE."
  layout: "centered"
  background: "#f8f9fa"
  typography: "cinematic"
  accent: "#1a1a1a"
  bgText: "ESSENCE"
  bgTextSize: "150"
  animate: "blur-reveal"
  text {
    content: "High-End Minimal Storytelling System"
    align: "center"
    size: "20"
    color: "#6b7280"
  }
}`,
        parentId: null
      },
      {
        id: 'min-philosophy',
        name: 'philosophy.dex',
        type: 'file',
        content: `slide {
  title: "Subtlety as Core Architecture"
  layout: "asymmetric-left"
  background: "#f8f9fa"
  bullets {
    "Remove redundant outline decorations."
    "Let spatial proportions structure visual focus."
    "Emphasize pure typography balance."
  }
}`,
        parentId: null
      },
      {
        id: 'min-metrics',
        name: 'metrics.dex',
        type: 'file',
        content: `slide {
  title: "Pillars of Composition"
  layout: "split-right"
  background: "#ffffff"
  image {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800"
  }
  bullets {
    "Whitespace represents the visual frame."
    "Off-center alignment guides continuous eye movement."
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'vc-pitch',
    title: 'Venture Capital Pitch',
    desc: 'Professional corporate deep teal styling with structural emerald lines, ROI statistics, and comparative analytical tables.',
    name: 'Venture Pitch',
    category: 'Venture Capital Pitch',
    files: [
      {
        id: 'vc-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#04101e"
  secondary: "#10b981"
  font: "Outfit"
}

import "cover.dex"
import "problem.dex"
import "revenue.dex"
`,
        parentId: null
      },
      {
        id: 'vc-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "SCALE v2"
  layout: "centered"
  background: "#04101e"
  typography: "neon"
  accent: "#10b981"
  decorations: "grid,rings"
  bgText: "GROWTH"
  bgTextSize: "160"
  animate: "blur-reveal"
  text {
    content: "Enterprise Business Transformation Model"
    align: "center"
    size: "22"
    color: "#10b981"
  }
}`,
        parentId: null
      },
      {
        id: 'vc-problem',
        name: 'problem.dex',
        type: 'file',
        content: `slide {
  title: "The Friction Cost Problem"
  layout: "split-left"
  background: "#020b16"
  image {
    src: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800"
  }
  bullets {
    "Corporate layout cycles consume 85% of authoring latency."
    "Siloed libraries reduce structural consistency."
  }
}`,
        parentId: null
      },
      {
        id: 'vc-revenue',
        name: 'revenue.dex',
        type: 'file',
        content: `slide {
  title: "Financial Efficiencies"
  layout: "asymmetric-left"
  background: "#020b16"
  glass: "true"
  decorations: "sphere"
  table {
    headers: "Efficiency, Manual Outlines, Dextranic IDE"
    rows: "Latency | 4.5 hours | 12 minutes; Resource Cost | $350 | $15; Layout Consistency | 40% | 100%"
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'creative-agency',
    title: 'Creative Agency Showcase',
    desc: 'Bespoke high-contrast creative showcase utilizing looping background abstract particle video art, metallic sphere components, and glowing cards.',
    name: 'Agency Showcase',
    category: 'Creative Agency Showcase',
    files: [
      {
        id: 'cr-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#000000"
  secondary: "#a855f7"
  font: "Outfit"
}

import "cover.dex"
import "showcase.dex"
import "founders.dex"
`,
        parentId: null
      },
      {
        id: 'cr-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "REBEL"
  layout: "centered"
  video: "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-particles-background-loop-42861-large.mp4"
  typography: "outlined"
  accent: "#a855f7"
  decorations: "rings"
  bgText: "REBEL"
  bgTextSize: "160"
  animate: "blur-reveal"
  text {
    content: "Deconstructing Conventional Media Design"
    align: "center"
    size: "20"
    color: "#a855f7"
  }
}`,
        parentId: null
      },
      {
        id: 'cr-showcase',
        name: 'showcase.dex',
        type: 'file',
        content: `slide {
  title: "Organic Curve Sculptures"
  layout: "split-right"
  background: "#000000"
  image {
    src: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800"
  }
  bullets {
    "Deconstructed spatial layouts."
    "Merging hard structural carbon steel with warm curves."
  }
}`,
        parentId: null
      },
      {
        id: 'cr-founders',
        name: 'founders.dex',
        type: 'file',
        content: `slide {
  title: "Founding Directors"
  layout: "asymmetric-left"
  background: "#0a0514"
  glass: "true"
  decorations: "sphere"
  bullets {
    "Ayush K. — Computational Media Director"
    "Emily S. — Visual Storytelling Lead"
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'saas-launch',
    title: 'SaaS Product Launch',
    desc: 'Vibrant futuristic product launch system leveraging loop tech tunnel videos, keyframed slow zooms, and custom metric lines.',
    name: 'SaaS Launch',
    category: 'SaaS Product Launch',
    files: [
      {
        id: 'saas-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#030712"
  secondary: "#38bdf8"
  font: "Outfit"
}

import "cover.dex"
import "dashboard.dex"
import "pricing.dex"
`,
        parentId: null
      },
      {
        id: 'saas-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "LAUNCH"
  layout: "centered"
  video: "https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-blue-lights-42283-large.mp4"
  typography: "cinematic"
  accent: "#38bdf8"
  decorations: "grid,rings"
  bgText: "LAUNCH"
  bgTextSize: "160"
  animate: "cinematic-zoom"
  text {
    content: "The Next Era of Cloud Performance Systems"
    align: "center"
    size: "22"
    color: "#38bdf8"
  }
}`,
        parentId: null
      },
      {
        id: 'saas-dashboard',
        name: 'dashboard.dex',
        type: 'file',
        content: `slide {
  title: "Engine Dashboard"
  layout: "split-left"
  background: "#030712"
  image {
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"
  }
  bullets {
    "Auto-tuning execution variables in real-time."
    "Sub-millisecond continuous latency monitoring."
  }
}`,
        parentId: null
      },
      {
        id: 'saas-pricing',
        name: 'pricing.dex',
        type: 'file',
        content: `slide {
  title: "Core Service Pricing"
  layout: "asymmetric-right"
  background: "#030712"
  glass: "true"
  decorations: "sphere"
  table {
    headers: "Tier, Monthly Compute, SLA Guarantee"
    rows: "SaaS-Developer | 500 hours | 99.9%; SaaS-Business | 5000 hours | 99.99%; SaaS-Enterprise | Unlimited | 99.999%"
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'luxury-architecture',
    title: 'High-End Architecture Deck',
    desc: 'Luxurious structure design deck using deep obsidian hues, floating ribbons, and spacious sans-serif headers.',
    name: 'Architecture Deck',
    category: 'High-End Architecture Deck',
    files: [
      {
        id: 'arch-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#1a1a1a"
  secondary: "#ffffff"
  font: "Outfit"
}

import "cover.dex"
import "philosophy.dex"
import "details.dex"
`,
        parentId: null
      },
      {
        id: 'arch-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "STRUCTURE"
  layout: "centered"
  background: "#1a1a1a"
  typography: "cinematic"
  accent: "#ffffff"
  animate: "cinematic-zoom"
  bgText: "STRUCTURE"
  bgTextSize: "130"
  text {
    content: "Luxury Environmental Architectural Systems"
    align: "center"
    size: "20"
    color: "#a1a1aa"
  }
}`,
        parentId: null
      },
      {
        id: 'arch-philosophy',
        name: 'philosophy.dex',
        type: 'file',
        content: `slide {
  title: "Creative Spatial Balance"
  layout: "asymmetric-left"
  background: "#111111"
  decorations: "rings"
  bullets {
    "Integrating physical concrete curves into landscapes."
    "Subtle ambient lighting loops inside structures."
  }
}`,
        parentId: null
      },
      {
        id: 'arch-details',
        name: 'details.dex',
        type: 'file',
        content: `slide {
  title: "Linear Dimensions"
  layout: "split-left"
  background: "#1a1a1a"
  image {
    src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800"
  }
  bullets {
    "Reinforced stainless steel joints."
    "Structural load distribution grids."
  }
}`,
        parentId: null
      }
    ]
  },
  {
    id: 'conference-presentation',
    title: 'Modern Conference Presentation',
    desc: 'High-fidelity tech conference system showcasing neon technical backgrounds, floating rings, and speaker bios.',
    name: 'Conference Deck',
    category: 'Modern Conference Presentation',
    files: [
      {
        id: 'conf-main',
        name: 'main.dex',
        type: 'file',
        content: `theme {
  primary: "#050b14"
  secondary: "#818cf8"
  font: "Outfit"
}

import "cover.dex"
import "remarks.dex"
import "metrics.dex"
`,
        parentId: null
      },
      {
        id: 'conf-cover',
        name: 'cover.dex',
        type: 'file',
        content: `slide {
  title: "KEYNOTE"
  layout: "centered"
  background: "#050b14"
  typography: "neon"
  accent: "#818cf8"
  decorations: "grid,rings"
  bgText: "KEYNOTE"
  bgTextSize: "160"
  animate: "blur-reveal"
  text {
    content: "DevConference Keynote address"
    align: "center"
    size: "22"
    color: "#818cf8"
  }
}`,
        parentId: null
      },
      {
        id: 'conf-remarks',
        name: 'remarks.dex',
        type: 'file',
        content: `slide {
  title: "Scalability Curves"
  layout: "split-left"
  background: "#02060d"
  image {
    src: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800"
  }
  bullets {
    "Welcome to Conference Keynote 2026."
    "Automating complex structures leads to creative leverage."
  }
}`,
        parentId: null
      },
      {
        id: 'conf-metrics',
        name: 'metrics.dex',
        type: 'file',
        content: `slide {
  title: "Core Comparison"
  layout: "asymmetric-left"
  background: "#050b14"
  glass: "true"
  table {
    headers: "Method, Automation rate, Latency"
    rows: "Traditional | Manual copy | 5 hours; Outline DSL | Automatic | 12 minutes"
  }
}`,
        parentId: null
      }
    ]
  }
];
