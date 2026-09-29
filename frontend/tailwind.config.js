/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: '#FBFBFA',
        surface: '#FFFFFF',
        'surface-subtle': '#F7F6F3',
        border: '#EAEAEA',
        'border-muted': 'rgba(0,0,0,0.06)',
        charcoal: '#111111',
        secondary: '#787774',
        // Minimalist Spot Pastels
        'pastel-red': '#FDEBEC',
        'pastel-red-text': '#9F2F2D',
        'pastel-blue': '#E1F3FE',
        'pastel-blue-text': '#1F6C9F',
        'pastel-green': '#EDF3EC',
        'pastel-green-text': '#346538',
        'pastel-yellow': '#FBF3DB',
        'pastel-yellow-text': '#956400',
      },
      fontFamily: {
        sans: ['"SF Pro Display"', '"Geist Sans"', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'sans-serif'],
        serif: ['"Newsreader"', '"Lyon Text"', '"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"Geist Mono"', '"SF Mono"', '"JetBrains Mono"', 'Consolas', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        card: '8px',
        pill: '9999px',
      },
      boxShadow: {
        subtle: '0 1px 2px rgba(0, 0, 0, 0.04)',
        hover: '0 2px 8px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
