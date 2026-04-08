import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        moai: {
          primary: "#0f766e",   // teal
          accent: "#f59e0b",    // amber
          ink: "#0f172a",
          paper: "#fafaf9",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "Hiragino Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
} satisfies Config;
