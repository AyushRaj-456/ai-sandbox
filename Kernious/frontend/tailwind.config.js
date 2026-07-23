/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          bg: "#090d16",
          card: "#111827",
          border: "#1f293d",
          hover: "#1a2436",
        },
        cp: {
          purple: "#a855f7",
          cyan: "#06b6d4",
          blue: "#3b82f6",
          green: "#22c55e",
          orange: "#f97316",
          red: "#ef4444",
          yellow: "#eab308",
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
