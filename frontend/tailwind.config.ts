import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg)",
        surface: "var(--surface)",
        surfaceCard: "var(--surface-card)",
        accentCyan: "#00E5FF",
        accentAmber: "#FF7B00",
        accentEmerald: "#10B981",
        accentPink: "#FF1F71",
        mutedText: "#94A3B8",
      },
      fontFamily: {
        sans: ["Barlow", "sans-serif"],
        heading: ["Rajdhani", "sans-serif"],
        mono: ["Space Mono", "monospace"],
      },
      boxShadow: {
        glass: "inset 0 1px 1px rgba(255, 255, 255, 0.1), 0 14px 40px rgba(0, 0, 0, 0.5)",
        cyanGlow: "0 0 20px rgba(0, 229, 255, 0.35)",
        amberGlow: "0 0 20px rgba(255, 123, 0, 0.35)",
      },
    },
  },
  plugins: [],
};
export default config;
