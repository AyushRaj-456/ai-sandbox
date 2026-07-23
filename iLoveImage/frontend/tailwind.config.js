/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: '#1a1a1e',
        'page-alt': '#16161a',
        surface: '#222226',
        'surface-hover': '#2a2a2f',
        'surface-elevated': '#2c2c31',
        input: '#1a1a1e',
        accent: '#4a7cff',
        'accent-hover': '#3d6ce6',
        'accent-subtle': 'rgba(74, 124, 255, 0.08)',
        'border-default': '#2e2e33',
        'border-subtle': '#272729',
        'border-accent': 'rgba(74, 124, 255, 0.35)',
        'text-primary': '#e8e8ec',
        'text-secondary': '#9a9aa0',
        'text-muted': '#6e6e76',
        'text-brand': '#d4d4da',
        success: '#34d399',
        'success-subtle': 'rgba(52, 211, 153, 0.1)',
        error: '#f87171',
        'error-subtle': 'rgba(248, 113, 113, 0.1)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Outfit"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        mono: ['"SF Mono"', '"Fira Code"', '"Cascadia Code"', 'monospace'],
      },
      maxWidth: {
        container: '1100px',
      },
    },
  },
  plugins: [],
}
